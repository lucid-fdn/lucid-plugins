#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMeetServer } from './mcp.js';

const server = createMeetServer();
const transport = new StdioServerTransport();
await server.connect(transport);
