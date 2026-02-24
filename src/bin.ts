#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMetricsServer } from './mcp.js';

const server = createMetricsServer();
const transport = new StdioServerTransport();
await server.connect(transport);
