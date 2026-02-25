// ---------------------------------------------------------------------------
// tools/technical-analysis.test.ts -- Tests for 10 TA MCP tools
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { createTaTools } from './technical-analysis.js';
import { AdapterRegistry } from '../adapters/registry.js';
import type { IExchangeAdapter } from '../adapters/types.js';
import type { OHLCV, ExchangeId, ExchangeCapability, CandleParams } from '../types/index.js';
import type { ToolDefinition } from './index.js';

// ---- Mock adapter -----------------------------------------------------------

/**
 * Generate synthetic OHLCV data: 100 bars of sinusoidal data around price 100.
 * This creates realistic-looking candle data with swings for testing.
 */
function generateSyntheticBars(count = 100): OHLCV[] {
  const bars: OHLCV[] = [];
  const basePrice = 100;
  const amplitude = 10;

  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 4; // Two full sine cycles
    const midPrice = basePrice + amplitude * Math.sin(t);
    const spread = 2;

    bars.push({
      timestamp: Date.now() - (count - i) * 3600000,
      open: midPrice - spread * 0.3,
      high: midPrice + spread,
      low: midPrice - spread,
      close: midPrice + spread * 0.3,
      volume: 1000 + Math.random() * 500,
    });
  }

  return bars;
}

function createMockAdapter(exchangeId: ExchangeId = 'hyperliquid'): IExchangeAdapter {
  const syntheticBars = generateSyntheticBars(100);

  return {
    exchangeId,
    capabilities: new Set<ExchangeCapability>(['ohlcv', 'ticker', 'orderbook', 'trades']),
    getCandles: async (params: CandleParams): Promise<OHLCV[]> => {
      const limit = params.limit ?? 100;
      return syntheticBars.slice(-limit);
    },
    getTicker: async () => ({
      exchange: exchangeId,
      symbol: 'BTC',
      last: 100,
      bid: 99.5,
      ask: 100.5,
      high24h: 110,
      low24h: 90,
      volume24h: 50000,
      quoteVolume24h: 5000000,
      change24h: 2,
      changePct24h: 2,
      timestamp: Date.now(),
    }),
    getPrice: async (symbol: string) => ({
      exchange: exchangeId,
      symbol,
      price: 100,
      timestamp: Date.now(),
    }),
    getOrderbook: async (symbol: string) => ({
      exchange: exchangeId,
      symbol,
      bids: [[99, 10]],
      asks: [[101, 10]],
      timestamp: Date.now(),
    }),
    getRecentTrades: async () => [],
    getInstruments: async () => [],
  };
}

// ---- Test helpers -----------------------------------------------------------

function findTool(tools: ToolDefinition[], name: string): ToolDefinition {
  const tool = tools.find((t) => t.name === name);
  if (!tool) throw new Error(`Tool "${name}" not found`);
  return tool;
}

// ---- Tests ------------------------------------------------------------------

describe('createTaTools', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns exactly 10 tools', () => {
    expect(tools).toHaveLength(10);
  });

  it('all tools have required properties', () => {
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.params).toBeDefined();
      expect(typeof tool.execute).toBe('function');
    }
  });

  it('tool names are unique', () => {
    const names = tools.map((t) => t.name);
    expect(new Set(names).size).toBe(10);
  });
});

describe('ta_analyze', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns valid JSON with all expected fields', async () => {
    const tool = findTool(tools, 'ta_analyze');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
      timeframe: '1h',
      limit: 100,
    });

    const result = JSON.parse(resultStr);

    // Top-level fields
    expect(result).toHaveProperty('exchange', 'hyperliquid');
    expect(result).toHaveProperty('symbol', 'BTC');
    expect(result).toHaveProperty('price');
    expect(typeof result.price).toBe('number');

    // RSI
    expect(result).toHaveProperty('rsi');
    expect(result.rsi).toHaveProperty('value');
    expect(result.rsi).toHaveProperty('signal');
    expect(['oversold', 'overbought', 'neutral']).toContain(result.rsi.signal);

    // MACD
    expect(result).toHaveProperty('macd');
    expect(result.macd).toHaveProperty('histogram');
    expect(result.macd).toHaveProperty('crossover');

    // Bollinger Bands
    expect(result).toHaveProperty('bollingerBands');
    expect(result.bollingerBands).toHaveProperty('upper');
    expect(result.bollingerBands).toHaveProperty('middle');
    expect(result.bollingerBands).toHaveProperty('lower');
    expect(result.bollingerBands).toHaveProperty('signal');

    // Trend
    expect(result).toHaveProperty('trend');
    expect(result.trend).toHaveProperty('classification');

    // S/R
    expect(result).toHaveProperty('supportResistance');

    // ATR
    expect(result).toHaveProperty('atr');

    // Volatility
    expect(result).toHaveProperty('volatility');
    expect(result.volatility).toHaveProperty('regime');

    // Confidence & recommendation
    expect(result).toHaveProperty('confidence');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);

    expect(result).toHaveProperty('recommendation');
    expect(['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell']).toContain(
      result.recommendation,
    );
  });
});

describe('ta_get_rsi', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns current RSI value and signal', async () => {
    const tool = findTool(tools, 'ta_get_rsi');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
      timeframe: '1h',
      limit: 100,
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('current');
    expect(typeof result.current).toBe('number');
    expect(result.current).toBeGreaterThanOrEqual(0);
    expect(result.current).toBeLessThanOrEqual(100);

    expect(result).toHaveProperty('signal');
    expect(['oversold', 'overbought', 'neutral']).toContain(result.signal);

    expect(result).toHaveProperty('values');
    expect(Array.isArray(result.values)).toBe(true);
    expect(result.values.length).toBeLessThanOrEqual(20);
  });

  it('accepts custom period', async () => {
    const tool = findTool(tools, 'ta_get_rsi');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
      period: 7,
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('period', 7);
    expect(result).toHaveProperty('current');
  });
});

describe('ta_get_macd', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns histogram and crossover', async () => {
    const tool = findTool(tools, 'ta_get_macd');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
      timeframe: '1h',
      limit: 100,
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('histogram');
    expect(typeof result.histogram).toBe('number');

    expect(result).toHaveProperty('crossover');
    expect(['bullish', 'bearish', 'none']).toContain(result.crossover);

    expect(result).toHaveProperty('macdLine');
    expect(result).toHaveProperty('signalLine');
    expect(result).toHaveProperty('signal');
  });
});

describe('ta_get_bollinger', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns upper/middle/lower bands', async () => {
    const tool = findTool(tools, 'ta_get_bollinger');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
      timeframe: '1h',
      limit: 100,
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('upper');
    expect(result).toHaveProperty('middle');
    expect(result).toHaveProperty('lower');
    expect(typeof result.upper).toBe('number');
    expect(typeof result.middle).toBe('number');
    expect(typeof result.lower).toBe('number');
    expect(result.upper).toBeGreaterThan(result.lower);

    expect(result).toHaveProperty('bandwidth');
    expect(result).toHaveProperty('squeeze');
    expect(result).toHaveProperty('signal');
  });
});

describe('ta_get_trend', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns trend classification', async () => {
    const tool = findTool(tools, 'ta_get_trend');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('trend');
    expect([
      'strong_uptrend',
      'uptrend',
      'sideways',
      'downtrend',
      'strong_downtrend',
    ]).toContain(result.trend);
    expect(result).toHaveProperty('pctAboveFast');
    expect(typeof result.pctAboveFast).toBe('number');
  });
});

describe('ta_get_support_resistance', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns supports and resistances arrays', async () => {
    const tool = findTool(tools, 'ta_get_support_resistance');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('supports');
    expect(result).toHaveProperty('resistances');
    expect(Array.isArray(result.supports)).toBe(true);
    expect(Array.isArray(result.resistances)).toBe(true);
    expect(result.supports.length).toBeLessThanOrEqual(5);
    expect(result.resistances.length).toBeLessThanOrEqual(5);
  });
});

describe('ta_get_volatility_regime', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns regime and multiplier', async () => {
    const tool = findTool(tools, 'ta_get_volatility_regime');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('historicalVolatility');
    expect(typeof result.historicalVolatility).toBe('number');
    expect(result).toHaveProperty('regime');
    expect(['low', 'moderate', 'high', 'extreme']).toContain(result.regime);
    expect(result).toHaveProperty('positionMultiplier');
    expect([0.25, 0.5, 1.0]).toContain(result.positionMultiplier);
  });
});

describe('ta_get_atr', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns ATR and suggested stops', async () => {
    const tool = findTool(tools, 'ta_get_atr');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('atr');
    expect(typeof result.atr).toBe('number');
    expect(result.atr).toBeGreaterThan(0);

    expect(result).toHaveProperty('atrPct');
    expect(result).toHaveProperty('suggestedStopDistance');
    expect(result).toHaveProperty('suggestedStopLong');
    expect(result).toHaveProperty('suggestedStopShort');

    // suggestedStop should be 1.5x ATR
    expect(result.suggestedStopDistance).toBeCloseTo(result.atr * 1.5, 2);
  });
});

describe('ta_get_ema_crossover', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns EMA values and crossover status', async () => {
    const tool = findTool(tools, 'ta_get_ema_crossover');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('fastEma');
    expect(result).toHaveProperty('slowEma');
    expect(result).toHaveProperty('spread');
    expect(result).toHaveProperty('crossover');
    expect(['bullish', 'bearish', 'none']).toContain(result.crossover);
    expect(result).toHaveProperty('signal');
  });

  it('rejects fastPeriod >= slowPeriod', async () => {
    const tool = findTool(tools, 'ta_get_ema_crossover');
    await expect(
      tool.execute({
        exchange: 'hyperliquid',
        symbol: 'BTC',
        fastPeriod: 21,
        slowPeriod: 9,
      }),
    ).rejects.toThrow('fastPeriod must be less than slowPeriod');
  });
});

describe('ta_score_setup', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    registry.register(createMockAdapter('hyperliquid'));
    tools = createTaTools(registry);
  });

  it('returns score and recommendation', async () => {
    const tool = findTool(tools, 'ta_score_setup');
    const resultStr = await tool.execute({
      exchange: 'hyperliquid',
      symbol: 'BTC',
    });

    const result = JSON.parse(resultStr);
    expect(result).toHaveProperty('confidence');
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);

    expect(result).toHaveProperty('recommendation');
    expect(['strong_buy', 'buy', 'neutral', 'sell', 'strong_sell']).toContain(
      result.recommendation,
    );

    expect(result).toHaveProperty('components');
    expect(result.components).toHaveProperty('rsi');
    expect(result.components).toHaveProperty('macd');
    expect(result.components).toHaveProperty('bollingerBands');
    expect(result.components).toHaveProperty('trend');
  });
});

describe('error handling', () => {
  let registry: AdapterRegistry;
  let tools: ToolDefinition[];

  beforeEach(() => {
    registry = new AdapterRegistry();
    // Intentionally do NOT register any adapters
    tools = createTaTools(registry);
  });

  it('each tool throws for unknown exchange', async () => {
    for (const tool of tools) {
      await expect(
        tool.execute({
          exchange: 'unknown_exchange',
          symbol: 'BTC',
          timeframe: '1h',
          limit: 100,
        }),
      ).rejects.toThrow(/not configured/);
    }
  });
});
