// ---------------------------------------------------------------------------
// categorize-tool.ts -- Auto-categorize feedback by topic/type
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { categorize } from '../analysis/categorizer.js';
import { analyzeSentiment, detectUrgency } from '../analysis/sentiment-analyzer.js';
import { updateFeedbackItem, getFeedbackById } from '../db/feedback-items.js';
import { log } from '../utils/logger.js';

export function createCategorizeTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_categorize',
    description:
      'Auto-categorize feedback text by topic/type. Can also update an existing feedback item with the detected category.',
    params: {
      text: { type: 'string', required: false, description: 'Text to categorize (if no feedback_id)' },
      feedback_id: {
        type: 'number',
        required: false,
        description: 'Existing feedback ID to categorize and update',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const feedbackId = params.feedback_id as number | undefined;
        let text = params.text as string | undefined;

        if (!text && !feedbackId) {
          return 'Error: Provide either text or feedback_id to categorize.';
        }

        if (feedbackId) {
          const item = await getFeedbackById(feedbackId);
          if (!item) return `Error: Feedback item #${feedbackId} not found.`;
          text = item.content;
        }

        const category = categorize(text!);
        const sentiment = analyzeSentiment(text!);
        const urgency = detectUrgency(text!);

        if (feedbackId) {
          await updateFeedbackItem(feedbackId, {
            category: category as any,
            sentiment: sentiment.sentiment,
            priority: urgency,
          });
        }

        const lines: string[] = [
          '## Categorization Result',
          '',
          `- **Category**: ${category}`,
          `- **Sentiment**: ${sentiment.sentiment} (${(sentiment.confidence * 100).toFixed(1)}%)`,
          `- **Urgency**: ${urgency}`,
        ];

        if (sentiment.keywords.length > 0) {
          lines.push(`- **Keywords**: ${sentiment.keywords.join(', ')}`);
        }

        if (feedbackId) {
          lines.push(`- **Updated feedback**: #${feedbackId}`);
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_categorize failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
