import type { PluginConfig } from '../types/index.js';
import { searchItems } from '../db/index.js';
import { truncate } from '../utils/text.js';
import { log } from '../utils/logger.js';
import type { ToolDefinition } from './types.js';

export interface SearchItemsDeps {
  config: PluginConfig;
}

export function createSearchItemsTool(deps: SearchItemsDeps): ToolDefinition {
  return {
    name: 'veille_search' as const,
    description: 'Search monitored content items by keyword. Returns matching items with titles, URLs, summaries, and metadata.',
    params: {
      query: { type: 'string', required: true, description: 'Search query' },
      limit: { type: 'number', required: false, min: 1, max: 100, description: 'Max results (default 20)' },
    },
    execute: async (params: { query: string; limit?: number }): Promise<string> => {
      try {
        const items = await searchItems(
          deps.config.tenantId,
          params.query,
          params.limit ?? 20,
        );

        if (items.length === 0) {
          return `No items found matching "${params.query}".`;
        }

        const lines = items.map((item, idx) => {
          const parts: string[] = [
            `${idx + 1}. ${item.title ?? '(no title)'}`,
            `   URL: ${item.canonical_url}`,
          ];

          if (item.source) {
            parts.push(`   Source: ${item.source}`);
          }

          if (item.author) {
            parts.push(`   Author: ${item.author}`);
          }

          if (item.published_at) {
            parts.push(`   Published: ${item.published_at}`);
          }

          if (item.tags && item.tags.length > 0) {
            parts.push(`   Tags: ${item.tags.join(', ')}`);
          }

          if (item.summary) {
            parts.push(`   Summary: ${truncate(item.summary, 200)}`);
          }

          parts.push(`   Status: ${item.status} | ID: ${item.id}`);

          return parts.join('\n');
        });

        return `Found ${items.length} item(s) matching "${params.query}":\n\n${lines.join('\n\n')}`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_search failed', msg);
        return `Error searching items: ${msg}`;
      }
    },
  };
}
