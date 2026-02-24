import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './adapters/mcp-adapter.js';
import { logger } from './core/utils/logger.js';
import { PLUGIN_NAME } from './core/plugin-id.js';

/**
 * Create and return a configured Propose MCP server.
 */
export function createProposeServer() {
  return createMcpServer();
}

/**
 * Start the MCP server with stdio transport.
 */
export async function startServer(): Promise<void> {
  const server = createProposeServer();
  const transport = new StdioServerTransport();

  logger.info(`Starting ${PLUGIN_NAME} MCP server...`);
  await server.connect(transport);
  logger.info(`${PLUGIN_NAME} MCP server is running`);
}

export { createMcpServer } from './adapters/mcp-adapter.js';
