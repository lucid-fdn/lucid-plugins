/**
 * Helius MCP Server wrapper.
 *
 * Creates an McpServer and registers all 63 Helius tools via registerTools().
 * The Helius package uses McpServer directly — same as our other plugins.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
// @ts-expect-error — helius-mcp doesn't export types but registerTools is available
import { registerTools } from 'helius-mcp/dist/tools/index.js'
// @ts-expect-error — set API key for the tools
import { setApiKey } from 'helius-mcp/dist/utils/helius.js'

/**
 * Create the Helius MCP server with all 63 Solana tools.
 * Synchronous factory — compatible with our embedded-skill-loader.
 */
export function createHeliusServer(): McpServer {
  // Set API key from env
  const apiKey = process.env.HELIUS_API_KEY || ''
  if (apiKey) setApiKey(apiKey)

  const server = new McpServer(
    { name: 'lucid-solana-intelligence', version: '1.0.0' },
    {
      instructions: 'Solana blockchain tools for trading agents. Query wallets, parse transactions, track holders, stream real-time data.',
    },
  )

  registerTools(server)
  return server
}
