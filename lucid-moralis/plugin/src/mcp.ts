/**
 * Moralis MCP Server — 7 trading-focused tools.
 *
 * Tools:
 * 1. moralis_token_score    — Security score (35+ metrics, honeypot/rug detection)
 * 2. moralis_token_price    — Real-time price with exchange info
 * 3. moralis_ohlcv          — OHLCV candles for technical analysis
 * 4. moralis_top_holders    — Top token holders (whale tracking)
 * 5. moralis_token_pairs    — DEX pairs + liquidity depth
 * 6. moralis_wallet_tokens  — Wallet token holdings
 * 7. moralis_wallet_worth   — Cross-chain net worth
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  getTokenScore,
  getTokenPrice,
  getOHLCV,
  getTopHolders,
  getTokenPairs,
  getWalletTokens,
  getWalletNetWorth,
} from './moralis-client.js'

const CHAIN_HELP = 'Chain: eth, polygon, bsc, arbitrum, base, optimism, avalanche, solana'

export function createMoralisServer(): McpServer {
  const apiKey = process.env.MORALIS_API_KEY || ''
  const server = new McpServer({ name: 'lucid-moralis', version: '1.0.0' })

  // 1. Token Security Score
  server.tool(
    'moralis_token_score',
    `Get token security score (0-100) with 35+ risk metrics including honeypot detection, rug pull flags, sell tax analysis, and contract verification. Use BEFORE any trade to assess token safety. ${CHAIN_HELP}`,
    {
      address: { type: 'string', description: 'Token contract address' },
      chain: { type: 'string', description: CHAIN_HELP, default: 'eth' },
    },
    async ({ address, chain }) => {
      const result = await getTokenScore(apiKey, address as string, (chain as string) || 'eth')
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // 2. Token Price
  server.tool(
    'moralis_token_price',
    `Get real-time token price in USD with exchange info, percent change, and native price. ${CHAIN_HELP}`,
    {
      address: { type: 'string', description: 'Token contract address' },
      chain: { type: 'string', description: CHAIN_HELP, default: 'eth' },
    },
    async ({ address, chain }) => {
      const result = await getTokenPrice(apiKey, address as string, (chain as string) || 'eth')
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // 3. OHLCV Candles
  server.tool(
    'moralis_ohlcv',
    `Get OHLCV candlestick data for a DEX pair. Use for technical analysis (RSI, MACD, Bollinger Bands). Timeframes: 1m, 5m, 15m, 1h, 4h, 1d. ${CHAIN_HELP}`,
    {
      pair_address: { type: 'string', description: 'DEX pair contract address (get from moralis_token_pairs)' },
      chain: { type: 'string', description: CHAIN_HELP, default: 'eth' },
      timeframe: { type: 'string', description: 'Candle timeframe: 1m, 5m, 15m, 1h, 4h, 1d', default: '1h' },
      limit: { type: 'number', description: 'Number of candles (max 100)', default: 60 },
    },
    async ({ pair_address, chain, timeframe, limit }) => {
      const result = await getOHLCV(
        apiKey,
        pair_address as string,
        (chain as string) || 'eth',
        (timeframe as string) || '1h',
        (limit as number) || 60,
      )
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // 4. Top Holders (Whale Tracking)
  server.tool(
    'moralis_top_holders',
    `Get top token holders ranked by balance. Shows whale concentration, contract vs EOA, percentage of supply. Use for whale tracking and ownership analysis. ${CHAIN_HELP}`,
    {
      address: { type: 'string', description: 'Token contract address' },
      chain: { type: 'string', description: CHAIN_HELP, default: 'eth' },
      limit: { type: 'number', description: 'Number of holders (max 50)', default: 10 },
    },
    async ({ address, chain, limit }) => {
      const result = await getTopHolders(
        apiKey,
        address as string,
        (chain as string) || 'eth',
        (limit as number) || 10,
      )
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // 5. Token Pairs + Liquidity
  server.tool(
    'moralis_token_pairs',
    `Get DEX pairs for a token with liquidity depth, volume, and price. Shows which exchanges have the best liquidity. Also returns pair addresses needed for moralis_ohlcv. ${CHAIN_HELP}`,
    {
      address: { type: 'string', description: 'Token contract address' },
      chain: { type: 'string', description: CHAIN_HELP, default: 'eth' },
      limit: { type: 'number', description: 'Number of pairs (max 20)', default: 5 },
    },
    async ({ address, chain, limit }) => {
      const result = await getTokenPairs(
        apiKey,
        address as string,
        (chain as string) || 'eth',
        (limit as number) || 5,
      )
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // 6. Wallet Token Holdings
  server.tool(
    'moralis_wallet_tokens',
    `Get all ERC20 token holdings for a wallet with USD values and portfolio percentages. ${CHAIN_HELP}`,
    {
      wallet: { type: 'string', description: 'Wallet address (0x...)' },
      chain: { type: 'string', description: CHAIN_HELP, default: 'eth' },
    },
    async ({ wallet, chain }) => {
      const result = await getWalletTokens(apiKey, wallet as string, (chain as string) || 'eth')
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  // 7. Wallet Net Worth
  server.tool(
    'moralis_wallet_worth',
    'Get cross-chain net worth for a wallet in USD. Covers ETH, Polygon, BSC, Arbitrum, Base, Optimism.',
    {
      wallet: { type: 'string', description: 'Wallet address (0x...)' },
    },
    async ({ wallet }) => {
      const result = await getWalletNetWorth(apiKey, wallet as string)
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    },
  )

  return server
}
