import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { getSupabaseClient } from '../db/client.js';
import { searchContentBlocks } from '../db/content-blocks.js';
import { loadConfig } from '../config/index.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  category: z.string().optional(),
});

export const searchContentTool: ToolDefinition = {
  name: 'propose_search_content',
  description:
    'Search reusable content blocks for proposals. Find pre-written content snippets by keyword or category to accelerate proposal writing.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const config = loadConfig();
      const db = getSupabaseClient();

      const blocks = await searchContentBlocks(
        db,
        config.tenantId,
        input.query,
        input.category,
      );

      return toolResult({
        message: `Found ${blocks.length} content block(s) matching "${input.query}"`,
        query: input.query,
        category: input.category ?? 'all',
        blocks,
      });
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to search content');
      return toolError(wrapped.message);
    }
  },
};
