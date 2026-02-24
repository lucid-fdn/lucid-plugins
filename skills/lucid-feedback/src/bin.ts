#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createFeedbackServer } from './mcp.js';

const server = createFeedbackServer();
const transport = new StdioServerTransport();
await server.connect(transport);
