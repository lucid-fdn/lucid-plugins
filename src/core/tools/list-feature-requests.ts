// ---------------------------------------------------------------------------
// list-feature-requests.ts -- List feature requests ranked by priority
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { PRIORITY_LEVELS } from '../types/common.js';
import { listFeedback } from '../db/feedback-items.js';
import { truncate } from '../utils/text.js';
import { formatRelative } from '../utils/date.js';
import { log } from '../utils/logger.js';

export function createListFeatureRequestsTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_list_feature_requests',
    description:
      'List feature requests extracted from feedback, ranked by priority and frequency. Helps product teams identify the most-requested features.',
    params: {
      priority: {
        type: 'enum',
        required: false,
        values: [...PRIORITY_LEVELS],
        description: 'Minimum priority level to include',
      },
      limit: { type: 'number', required: false, min: 1, max: 100, description: 'Max results (default 20)' },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const items = await listFeedback({
          category: 'feature_request',
          limit: (params.limit as number) ?? 20,
        });

        // Filter by minimum priority if provided
        const priorityOrder = [...PRIORITY_LEVELS];
        const minPriority = params.priority as string | undefined;
        const filtered = minPriority
          ? items.filter((i) => {
              const idx = priorityOrder.indexOf(i.priority as any);
              const minIdx = priorityOrder.indexOf(minPriority as any);
              return idx >= minIdx;
            })
          : items;

        if (filtered.length === 0) {
          return 'No feature requests found. Use feedback_track_feature_request to create one.';
        }

        const lines: string[] = [`## Feature Requests (${filtered.length} results)`, ''];

        for (const item of filtered) {
          lines.push(
            `### #${item.id} [${(item.priority ?? 'low').toUpperCase()}]`,
          );
          lines.push(`- **Content**: ${truncate(item.content, 200)}`);
          lines.push(`- **Sentiment**: ${item.sentiment ?? 'unknown'}`);
          lines.push(`- **Status**: ${item.status}`);
          if (item.author_name) lines.push(`- **Requested by**: ${item.author_name}`);
          if (item.tags.length > 0) lines.push(`- **Tags**: ${item.tags.join(', ')}`);
          lines.push(`- **Created**: ${formatRelative(item.created_at)}`);
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_list_feature_requests failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
