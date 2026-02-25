// ---------------------------------------------------------------------------
// mcp.ts -- MCP server factory for Lucid Trade
// ---------------------------------------------------------------------------

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadConfig } from './config.js';
import { AdapterRegistry } from './adapters/registry.js';
import { createAllTools } from './tools/index.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from './plugin-id.js';
import { log } from './utils/logger.js';

/**
 * Create and configure the Lucid Trade MCP server.
 *
 * 1. Load config from env
 * 2. Create adapter registry (adapters registered in Phase 2+)
 * 3. Create McpServer and register all tools
 */
export function createTradeServer(
  env: Record<string, string | undefined> = process.env,
): McpServer {
  const config = loadConfig(env);
  log.setLevel(config.logLevel);

  const registry = new AdapterRegistry();

  const tools = createAllTools({ config, registry });

  const server = new McpServer({
    name: PLUGIN_NAME,
    version: PLUGIN_VERSION,
  });

  for (const tool of tools) {
    server.tool(tool.name, tool.description, async (params: Record<string, unknown>) => {
      const result = await tool.execute(params);
      return { content: [{ type: 'text' as const, text: result }] };
    });
  }

  log.info(`${PLUGIN_NAME} MCP server created (${tools.length} tools)`);
  return server;
}
