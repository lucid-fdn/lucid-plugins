// ---------------------------------------------------------------------------
// search-meetings.ts -- Search across meeting transcripts
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { listMeetings } from '../db/meetings.js';
import { truncate } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createSearchMeetingsTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_search_meetings',
    description:
      'Search across meeting transcripts, summaries, and titles for a keyword or phrase. Returns matching meetings with context snippets.',
    params: {
      query: {
        type: 'string',
        required: true,
        description: 'Search query to match against meeting content',
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 50,
        description: 'Maximum number of results (default: 10)',
      },
    },
    execute: async (params: { query: string; limit?: number }): Promise<string> => {
      try {
        const allMeetings = await listMeetings({ limit: 200 });
        const query = params.query.toLowerCase();
        const maxResults = params.limit ?? 10;

        const matches = allMeetings
          .filter((m) => {
            const searchable = [
              m.title,
              m.transcript ?? '',
              m.summary ?? '',
              ...(m.key_topics ?? []),
            ]
              .join(' ')
              .toLowerCase();
            return searchable.includes(query);
          })
          .slice(0, maxResults);

        if (matches.length === 0) {
          return `No meetings found matching "${params.query}".`;
        }

        const lines: string[] = [
          `## Search Results for "${params.query}" (${matches.length})`,
          '',
        ];

        for (const m of matches) {
          lines.push(`### #${m.id}: ${m.title}`);
          lines.push(`- **Type**: ${m.type} | **Date**: ${m.scheduled_at}`);

          // Extract context snippet
          const text = (m.transcript ?? m.summary ?? '').toLowerCase();
          const idx = text.indexOf(query);
          if (idx >= 0) {
            const start = Math.max(0, idx - 50);
            const end = Math.min(text.length, idx + query.length + 50);
            const snippet = (m.transcript ?? m.summary ?? '').slice(start, end);
            lines.push(`- **Match**: ...${snippet}...`);
          }

          if (m.key_topics?.length) {
            lines.push(`- **Topics**: ${truncate(m.key_topics.join(', '), 100)}`);
          }
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_search_meetings failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
