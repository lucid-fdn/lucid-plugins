import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig } from './core/config/index.js';
import { getSupabaseClient } from './core/db/client.js';
import { createProviderRegistry } from './domain/providers/index.js';
import { createAllTools } from './core/tools/index.js';
import { startScheduler } from './core/services/index.js';
import { toZodSchema } from './adapters/zod-schema.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from './core/plugin-id.js';
import { logger } from './core/utils/logger.js';

export function createBridgeServer(
  _env: Record<string, string | undefined> = process.env,
): McpServer {
  const config = loadConfig();
  getSupabaseClient(config.supabaseUrl, config.supabaseKey);

  const providerRegistry = createProviderRegistry(config);
  const tools = createAllTools({ config, providerRegistry });

  const server = new McpServer({
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,
  });

  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      toZodSchema(tool.parameters).shape,
      async (params: Record<string, unknown>) => {
        const result = await tool.handler(params);
        return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
      },
    );
  }

  startScheduler({ config, providerRegistry });

  logger.info(`${PLUGIN_NAME} MCP server created (${tools.length} tools)`);
  return server;
}
