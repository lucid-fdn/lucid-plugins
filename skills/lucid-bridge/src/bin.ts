#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createBridgeServer } from './mcp.js';

const server = createBridgeServer();
const transport = new StdioServerTransport();
await server.connect(transport);
