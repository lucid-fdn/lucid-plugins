/**
 * Moralis API client — thin wrapper with caching.
 *
 * Endpoints selected for trading agent quality:
 * - Token security score (35+ metrics, honeypot/rug detection)
 * - Token price + OHLCV candles
 * - Top holders (whale tracking)
 * - Wallet token balances + net worth
 * - Token pairs + liquidity
 */

const BASE_URL = 'https://deep-index.moralis.io/api/v2.2'
const SOLANA_BASE = 'https://solana-gateway.moralis.io'

// Simple in-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry || entry.expiresAt < Date.now()) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
  // LRU eviction at 500 entries
  if (cache.size > 500) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
}

async function moralisGet(path: string, apiKey: string, base = BASE_URL): Promise<unknown> {
  const res = await fetch(`${base}${path}`, {
    headers: { 'X-API-Key': apiKey, 'Accept': 'application/json' },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Moralis ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json()
}

// ── Token Security Score ──────────────────────────────────────────────

export interface TokenScore {
  tokenAddress: string
  score: number
  securityScore?: number
  metrics?: Record<string, unknown>
}

export async function getTokenScore(
  apiKey: string,
  address: string,
  chain = 'eth',
): Promise<TokenScore> {
  const cacheKey = `score:${chain}:${address}`
  const cached = getCached<TokenScore>(cacheKey)
  if (cached) return cached

  const data = await moralisGet(
    `/erc20/metadata?chain=${chain}&addresses[]=${address}`,
    apiKey,
  ) as unknown[]

  const token = Array.isArray(data) ? data[0] : data
  const result = {
    tokenAddress: address,
    score: (token as Record<string, unknown>)?.security_score as number ?? 0,
    securityScore: (token as Record<string, unknown>)?.security_score as number ?? 0,
    metrics: token as Record<string, unknown>,
  }

  setCache(cacheKey, result, 24 * 60 * 60 * 1000) // 24h TTL
  return result
}

// ── Token Price ───────────────────────────────────────────────────────

export interface TokenPrice {
  usdPrice: number
  usdPriceFormatted?: string
  nativePrice?: { value: string; decimals: number; name: string; symbol: string }
  exchangeName?: string
  exchangeAddress?: string
  tokenAddress: string
}

export async function getTokenPrice(
  apiKey: string,
  address: string,
  chain = 'eth',
): Promise<TokenPrice> {
  const cacheKey = `price:${chain}:${address}`
  const cached = getCached<TokenPrice>(cacheKey)
  if (cached) return cached

  const data = await moralisGet(
    `/erc20/${address}/price?chain=${chain}&include=percent_change`,
    apiKey,
  ) as TokenPrice

  setCache(cacheKey, data, 15_000) // 15s TTL
  return data
}

// ── OHLCV Candles ─────────────────────────────────────────────────────

export interface OHLCVCandle {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export async function getOHLCV(
  apiKey: string,
  pairAddress: string,
  chain = 'eth',
  timeframe = '1h',
  limit = 60,
): Promise<OHLCVCandle[]> {
  const cacheKey = `ohlcv:${chain}:${pairAddress}:${timeframe}:${limit}`
  const cached = getCached<OHLCVCandle[]>(cacheKey)
  if (cached) return cached

  const data = await moralisGet(
    `/pairs/${pairAddress}/ohlcv?chain=${chain}&timeframe=${timeframe}&limit=${limit}`,
    apiKey,
  ) as { result: OHLCVCandle[] }

  const candles = data.result || []
  setCache(cacheKey, candles, 60_000) // 60s TTL
  return candles
}

// ── Top Holders (Whale Tracking) ──────────────────────────────────────

export interface TopHolder {
  address: string
  balance: string
  balanceFormatted: string
  percentageRelativeToTotalSupply: number
  usdValue?: number
  isContract: boolean
}

export async function getTopHolders(
  apiKey: string,
  address: string,
  chain = 'eth',
  limit = 10,
): Promise<TopHolder[]> {
  const cacheKey = `holders:${chain}:${address}:${limit}`
  const cached = getCached<TopHolder[]>(cacheKey)
  if (cached) return cached

  const data = await moralisGet(
    `/erc20/${address}/top-holders?chain=${chain}&limit=${limit}`,
    apiKey,
  ) as { result: TopHolder[] }

  const holders = data.result || []
  setCache(cacheKey, holders, 5 * 60_000) // 5min TTL
  return holders
}

// ── Token Pairs + Liquidity ───────────────────────────────────────────

export interface TokenPair {
  pairAddress: string
  pairLabel: string
  exchangeName: string
  usdPrice: number
  liquidityUsd: number
  volume24h?: number
  priceChange24h?: number
}

export async function getTokenPairs(
  apiKey: string,
  address: string,
  chain = 'eth',
  limit = 5,
): Promise<TokenPair[]> {
  const cacheKey = `pairs:${chain}:${address}:${limit}`
  const cached = getCached<TokenPair[]>(cacheKey)
  if (cached) return cached

  const data = await moralisGet(
    `/erc20/${address}/pairs?chain=${chain}&limit=${limit}`,
    apiKey,
  ) as { result: TokenPair[] }

  const pairs = data.result || []
  setCache(cacheKey, pairs, 60_000) // 60s TTL
  return pairs
}

// ── Wallet Portfolio ──────────────────────────────────────────────────

export interface WalletToken {
  tokenAddress: string
  symbol: string
  name: string
  balance: string
  balanceFormatted: string
  usdPrice: number
  usdValue: number
  portfolioPercentage: number
}

export async function getWalletTokens(
  apiKey: string,
  walletAddress: string,
  chain = 'eth',
): Promise<WalletToken[]> {
  const cacheKey = `wallet:${chain}:${walletAddress}`
  const cached = getCached<WalletToken[]>(cacheKey)
  if (cached) return cached

  const data = await moralisGet(
    `/${walletAddress}/erc20?chain=${chain}`,
    apiKey,
  ) as WalletToken[]

  const tokens = Array.isArray(data) ? data : []
  setCache(cacheKey, tokens, 30_000) // 30s TTL
  return tokens
}

// ── Wallet Net Worth ──────────────────────────────────────────────────

export interface WalletNetWorth {
  totalNetWorthUsd: string
  chains: Array<{ chain: string; netWorthUsd: string }>
}

export async function getWalletNetWorth(
  apiKey: string,
  walletAddress: string,
  chains = ['eth', 'polygon', 'bsc', 'arbitrum', 'base', 'optimism'],
): Promise<WalletNetWorth> {
  const cacheKey = `networth:${walletAddress}`
  const cached = getCached<WalletNetWorth>(cacheKey)
  if (cached) return cached

  const data = await moralisGet(
    `/wallets/${walletAddress}/net-worth?chains[]=${chains.join('&chains[]=')}`,
    apiKey,
  ) as WalletNetWorth

  setCache(cacheKey, data, 60_000) // 60s TTL
  return data
}
