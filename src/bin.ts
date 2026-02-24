#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createSeoServer } from './mcp.js';

const server = createSeoServer();
const transport = new StdioServerTransport();
await server.connect(transport);
