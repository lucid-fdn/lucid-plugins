// ---------------------------------------------------------------------------
// config.ts -- Configuration loader (Zod schema, all credentials optional)
// ---------------------------------------------------------------------------

import { z } from 'zod';

/**
 * Exchange credential block — every field is optional so the plugin can run
 * in read-only / partial mode when not all exchanges are configured.
 */
const exchangeCredentials = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  passphrase: z.string().optional(),
  subaccount: z.string().optional(),
  testnet: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
});

/** Full plugin configuration schema */
export const ConfigSchema = z.object({
  // -- Supabase (optional — needed for persistence / history) ----------------
  supabaseUrl: z.string().url().optional(),
  supabaseKey: z.string().optional(),

  // -- Exchange credentials (all optional) -----------------------------------
  binance: exchangeCredentials.default({}),
  bybit: exchangeCredentials.default({}),
  okx: exchangeCredentials.default({}),
  hyperliquid: exchangeCredentials.default({}),
  dydx: exchangeCredentials.default({}),
  jupiter: exchangeCredentials.default({}),
  raydium: exchangeCredentials.default({}),

  // -- General settings ------------------------------------------------------
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  defaultExchange: z.string().optional(),
});

export type PluginConfig = z.infer<typeof ConfigSchema>;

/**
 * Load configuration from environment variables.
 *
 * Env var naming convention:
 *   TRADE_SUPABASE_URL, TRADE_SUPABASE_KEY
 *   TRADE_BINANCE_API_KEY, TRADE_BINANCE_API_SECRET, ...
 *   TRADE_LOG_LEVEL, TRADE_DEFAULT_EXCHANGE
 */
export function loadConfig(env: Record<string, string | undefined> = process.env): PluginConfig {
  return ConfigSchema.parse({
    supabaseUrl: env.TRADE_SUPABASE_URL,
    supabaseKey: env.TRADE_SUPABASE_KEY,

    binance: {
      apiKey: env.TRADE_BINANCE_API_KEY,
      apiSecret: env.TRADE_BINANCE_API_SECRET,
      passphrase: env.TRADE_BINANCE_PASSPHRASE,
      subaccount: env.TRADE_BINANCE_SUBACCOUNT,
      testnet: env.TRADE_BINANCE_TESTNET,
    },
    bybit: {
      apiKey: env.TRADE_BYBIT_API_KEY,
      apiSecret: env.TRADE_BYBIT_API_SECRET,
      passphrase: env.TRADE_BYBIT_PASSPHRASE,
      subaccount: env.TRADE_BYBIT_SUBACCOUNT,
      testnet: env.TRADE_BYBIT_TESTNET,
    },
    okx: {
      apiKey: env.TRADE_OKX_API_KEY,
      apiSecret: env.TRADE_OKX_API_SECRET,
      passphrase: env.TRADE_OKX_PASSPHRASE,
      subaccount: env.TRADE_OKX_SUBACCOUNT,
      testnet: env.TRADE_OKX_TESTNET,
    },
    hyperliquid: {
      apiKey: env.TRADE_HYPERLIQUID_API_KEY,
      apiSecret: env.TRADE_HYPERLIQUID_API_SECRET,
      testnet: env.TRADE_HYPERLIQUID_TESTNET,
    },
    dydx: {
      apiKey: env.TRADE_DYDX_API_KEY,
      apiSecret: env.TRADE_DYDX_API_SECRET,
      passphrase: env.TRADE_DYDX_PASSPHRASE,
      testnet: env.TRADE_DYDX_TESTNET,
    },
    jupiter: {
      apiKey: env.TRADE_JUPITER_API_KEY,
    },
    raydium: {
      apiKey: env.TRADE_RAYDIUM_API_KEY,
    },

    logLevel: env.TRADE_LOG_LEVEL,
    defaultExchange: env.TRADE_DEFAULT_EXCHANGE,
  });
}
