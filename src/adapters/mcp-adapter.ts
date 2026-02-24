import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ALL_TOOLS } from '../core/tools/index.js';
import { PLUGIN_ID, PLUGIN_NAME } from '../core/plugin-id.js';
import { logger } from '../core/utils/logger.js';

/**
 * Register all Propose tools with an MCP server instance.
 */
export function registerTools(server: McpServer): void {
  for (const tool of ALL_TOOLS) {
    const shape = tool.inputSchema instanceof z.ZodObject ? tool.inputSchema.shape : {};

    server.tool(
      tool.name,
      tool.description,
      shape as Record<string, z.ZodType>,
      async (params: Record<string, unknown>) => {
        logger.debug(`Executing tool: ${tool.name}`);
        try {
          return await tool.handler(params);
        } catch (error) {
          logger.error(`Tool ${tool.name} failed:`, error);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Unknown error',
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  logger.info(`Registered ${ALL_TOOLS.length} tools for ${PLUGIN_NAME}`);
}

/**
 * Create and configure an MCP server for Lucid Propose.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: PLUGIN_ID,
    version: '0.1.0',
  });

  registerTools(server);
  return server;
}
