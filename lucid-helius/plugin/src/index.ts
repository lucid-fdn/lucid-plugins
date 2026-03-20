/**
 * Lucid Solana Intelligence — wraps Helius MCP server for embedded execution.
 *
 * 63 Solana tools: wallet analysis, token holders, transaction parsing,
 * webhooks, real-time streaming, priority fees, transfers.
 *
 * Requires: HELIUS_API_KEY env var.
 */

export { createHeliusServer } from './mcp.js'
