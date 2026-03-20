#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMoralisServer } from './mcp.js'

const server = createMoralisServer()
const transport = new StdioServerTransport()
await server.connect(transport)
