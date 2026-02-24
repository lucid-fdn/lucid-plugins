#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createVeilleServer } from './mcp.js';

const server = createVeilleServer();
const transport = new StdioServerTransport();
await server.connect(transport);
