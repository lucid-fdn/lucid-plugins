#!/usr/bin/env node

import { startServer } from './mcp.js';

startServer().catch((error) => {
  console.error('Failed to start Lucid Propose MCP server:', error);
  process.exit(1);
});
