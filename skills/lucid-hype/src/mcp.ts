import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig } from './core/config/index.js';
import { initSupabase } from './core/db/client.js';
import { createAllTools } from './core/tools/index.js';
import { startScheduler } from './core/services/index.js';
import { toZodSchema } from './adapters/zod-schema.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from './core/plugin-id.js';
import { log } from './core/utils/logger.js';

export function createHypeServer(_env: Record<string, string | undefined> = process.env): McpServer {
  const config = loadConfig();
  initSupabase(config.supabaseUrl, config.supabaseKey);

  const tools = createAllTools({ config });

  const server = new McpServer({
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,
  });

  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      toZodSchema(tool.params).shape,
      async (params: Record<string, unknown>) => {
        const result = await tool.execute(params);
        return { content: [{ type: 'text' as const, text: result }] };
      },
    );
  }

  startScheduler({ config });

  log.info(`${PLUGIN_NAME} MCP server created (${tools.length} tools)`);
  return server;
}
