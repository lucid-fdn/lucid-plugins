// ---------------------------------------------------------------------------
// track-feature-request.ts -- Create/update feature request from feedback
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { PRIORITY_LEVELS } from '../types/common.js';
import { createFeedbackItem, updateFeedbackItem, getFeedbackById } from '../db/feedback-items.js';
import { analyzeSentiment, detectUrgency } from '../analysis/sentiment-analyzer.js';
import { log } from '../utils/logger.js';

export function createTrackFeatureRequestTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_track_feature_request',
    description:
      'Create a new feature request or update an existing feedback item to mark it as a feature request. Assigns priority based on content analysis.',
    params: {
      content: { type: 'string', required: true, description: 'Description of the feature request' },
      feedback_id: {
        type: 'number',
        required: false,
        description: 'Existing feedback ID to convert to a feature request',
      },
      priority: {
        type: 'enum',
        required: false,
        values: [...PRIORITY_LEVELS],
        description: 'Priority level (auto-detected if omitted)',
      },
      author_name: { type: 'string', required: false, description: 'Name of the requester' },
      tags: {
        type: 'array',
        required: false,
        items: { type: 'string' },
        description: 'Tags for the feature request',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const content = params.content as string;
        const feedbackId = params.feedback_id as number | undefined;
        const priority = (params.priority as string) ?? detectUrgency(content);
        const sentiment = analyzeSentiment(content);

        if (feedbackId) {
          const existing = await getFeedbackById(feedbackId);
          if (!existing) {
            return `Error: Feedback item #${feedbackId} not found.`;
          }

          const updated = await updateFeedbackItem(feedbackId, {
            category: 'feature_request',
            priority: priority as any,
            sentiment: sentiment.sentiment,
          });

          return [
            '## Feature Request Updated',
            '',
            `- **ID**: ${updated.id}`,
            `- **Category**: feature_request`,
            `- **Priority**: ${updated.priority}`,
            `- **Sentiment**: ${updated.sentiment}`,
            `- **Status**: ${updated.status}`,
          ].join('\n');
        }

        const item = await createFeedbackItem({
          content,
          channel: 'manual',
          category: 'feature_request',
          sentiment: sentiment.sentiment,
          priority: priority as any,
          author_name: (params.author_name as string) ?? null,
          tags: (params.tags as string[]) ?? ['feature-request'],
          metadata: { type: 'feature_request' },
        });

        return [
          '## Feature Request Created',
          '',
          `- **ID**: ${item.id}`,
          `- **Content**: ${content.slice(0, 200)}${content.length > 200 ? '...' : ''}`,
          `- **Priority**: ${item.priority}`,
          `- **Sentiment**: ${item.sentiment}`,
          `- **Status**: ${item.status}`,
        ].join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_track_feature_request failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
