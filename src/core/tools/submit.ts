// ---------------------------------------------------------------------------
// submit.ts -- Submit a new feedback entry
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { CHANNELS, CATEGORIES, SENTIMENTS, PRIORITY_LEVELS } from '../types/common.js';
import { createFeedbackItem } from '../db/feedback-items.js';
import { analyzeSentiment } from '../analysis/sentiment-analyzer.js';
import { categorize } from '../analysis/categorizer.js';
import { detectUrgency } from '../analysis/sentiment-analyzer.js';
import { log } from '../utils/logger.js';

export function createSubmitTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_submit',
    description:
      'Submit a new feedback entry. Automatically analyzes sentiment, categorizes content, and assigns priority if not provided.',
    params: {
      content: { type: 'string', required: true, description: 'The feedback text content' },
      channel: {
        type: 'enum',
        required: false,
        values: [...CHANNELS],
        description: 'Source channel of the feedback',
      },
      category: {
        type: 'enum',
        required: false,
        values: [...CATEGORIES],
        description: 'Feedback category (auto-detected if omitted)',
      },
      sentiment: {
        type: 'enum',
        required: false,
        values: [...SENTIMENTS],
        description: 'Sentiment label (auto-detected if omitted)',
      },
      rating: { type: 'number', required: false, min: 1, max: 5, description: 'Star rating 1-5' },
      nps_score: { type: 'number', required: false, min: 0, max: 10, description: 'NPS score 0-10' },
      author_name: { type: 'string', required: false, description: 'Name of the feedback author' },
      author_email: { type: 'string', required: false, description: 'Email of the feedback author' },
      priority: {
        type: 'enum',
        required: false,
        values: [...PRIORITY_LEVELS],
        description: 'Priority level (auto-detected if omitted)',
      },
      tags: {
        type: 'array',
        required: false,
        items: { type: 'string' },
        description: 'Tags to attach to the feedback',
      },
      metadata: { type: 'object', required: false, description: 'Additional metadata' },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const content = params.content as string;

        // Auto-detect sentiment if not provided
        const sentimentResult = analyzeSentiment(content);
        const sentiment = (params.sentiment as string) ?? sentimentResult.sentiment;

        // Auto-detect category if not provided
        const category = (params.category as string) ?? categorize(content);

        // Auto-detect priority if not provided
        const priority = (params.priority as string) ?? detectUrgency(content);

        const item = await createFeedbackItem({
          content,
          channel: (params.channel as any) ?? 'manual',
          category: category as any,
          sentiment: sentiment as any,
          rating: (params.rating as number) ?? null,
          nps_score: (params.nps_score as number) ?? null,
          author_name: (params.author_name as string) ?? null,
          author_email: (params.author_email as string) ?? null,
          priority: priority as any,
          tags: (params.tags as string[]) ?? [],
          metadata: (params.metadata as Record<string, unknown>) ?? {},
        });

        const lines: string[] = [
          '## Feedback Submitted',
          '',
          `- **ID**: ${item.id}`,
          `- **Channel**: ${item.channel}`,
          `- **Category**: ${item.category}`,
          `- **Sentiment**: ${item.sentiment} (confidence: ${(sentimentResult.confidence * 100).toFixed(0)}%)`,
          `- **Priority**: ${item.priority}`,
          `- **Status**: ${item.status}`,
        ];

        if (item.rating !== null) lines.push(`- **Rating**: ${item.rating}/5`);
        if (item.nps_score !== null) lines.push(`- **NPS Score**: ${item.nps_score}/10`);
        if (sentimentResult.keywords.length > 0) {
          lines.push(`- **Keywords**: ${sentimentResult.keywords.join(', ')}`);
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_submit failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
