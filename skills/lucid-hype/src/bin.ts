#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createHypeServer } from './mcp.js';

const server = createHypeServer();
const transport = new StdioServerTransport();
await server.connect(transport);
