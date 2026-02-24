import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PLUGIN_ID, PLUGIN_NAME } from './core/plugin-id.js';
import { loadConfig } from './core/config/loader.js';
import { createToolDefinitions } from './core/tools/definitions.js';
import { toZodSchema } from './adapters/zod-schema.js';
import { logger } from './core/utils/logger.js';
import type { PluginConfig } from './core/types/config.js';

export function createRecruitServer(overrides?: Partial<PluginConfig>): McpServer {
  const config = loadConfig(overrides);

  logger.info(`Initializing ${PLUGIN_NAME} MCP server (tenant: ${config.tenantId})`);

  const server = new McpServer({
    name: PLUGIN_ID,
    version: '1.0.0',
  });

  const tools = createToolDefinitions(config);

  for (const tool of tools) {
    const schema = toZodSchema(tool.params);
    server.tool(tool.name, tool.description, schema as unknown as Record<string, never>, async (args: Record<string, unknown>) => {
      try {
        const result = await tool.execute(args);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`Tool ${tool.name} failed: ${message}`);
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ success: false, error: message }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  logger.info(`Registered ${tools.length} tools`);
  return server;
}
