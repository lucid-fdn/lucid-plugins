// ---------------------------------------------------------------------------
// list.ts -- List feedback with filters
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { CHANNELS, SENTIMENTS, CATEGORIES, FEEDBACK_STATUSES, PRIORITY_LEVELS } from '../types/common.js';
import { listFeedback } from '../db/feedback-items.js';
import { formatRelative } from '../utils/date.js';
import { truncate } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createListTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_list',
    description:
      'List feedback entries with optional filters by channel, sentiment, category, status, priority, or search query.',
    params: {
      channel: { type: 'enum', required: false, values: [...CHANNELS], description: 'Filter by source channel' },
      sentiment: { type: 'enum', required: false, values: [...SENTIMENTS], description: 'Filter by sentiment' },
      category: { type: 'enum', required: false, values: [...CATEGORIES], description: 'Filter by category' },
      status: { type: 'enum', required: false, values: [...FEEDBACK_STATUSES], description: 'Filter by status' },
      priority: { type: 'enum', required: false, values: [...PRIORITY_LEVELS], description: 'Filter by priority' },
      query: { type: 'string', required: false, description: 'Text search query' },
      limit: { type: 'number', required: false, min: 1, max: 100, description: 'Max results (default 20)' },
      offset: { type: 'number', required: false, min: 0, description: 'Pagination offset' },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const items = await listFeedback({
          channel: params.channel as any,
          sentiment: params.sentiment as any,
          category: params.category as any,
          status: params.status as any,
          priority: params.priority as any,
          query: params.query as string | undefined,
          limit: (params.limit as number) ?? 20,
          offset: (params.offset as number) ?? 0,
        });

        if (items.length === 0) {
          return 'No feedback items found matching the given filters.';
        }

        const lines: string[] = [`## Feedback Items (${items.length} results)`, ''];

        for (const item of items) {
          lines.push(`### #${item.id} [${item.sentiment ?? 'unscored'}] — ${item.category ?? 'uncategorized'}`);
          lines.push(`- **Channel**: ${item.channel} | **Priority**: ${item.priority ?? 'none'} | **Status**: ${item.status}`);
          lines.push(`- **Content**: ${truncate(item.content, 200)}`);
          if (item.rating !== null) lines.push(`- **Rating**: ${item.rating}/5`);
          if (item.nps_score !== null) lines.push(`- **NPS**: ${item.nps_score}/10`);
          if (item.author_name) lines.push(`- **Author**: ${item.author_name}`);
          lines.push(`- **Created**: ${formatRelative(item.created_at)}`);
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_list failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
