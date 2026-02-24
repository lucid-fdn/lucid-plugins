import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createRecruitServer } from './mcp.js';
import { logger } from './core/utils/logger.js';

async function main() {
  try {
    const server = createRecruitServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Lucid Recruit MCP server running on stdio');
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
