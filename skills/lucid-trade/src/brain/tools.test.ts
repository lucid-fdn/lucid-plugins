// ---------------------------------------------------------------------------
// brain/tools.test.ts -- Tests for 7 brain MCP tools
// ---------------------------------------------------------------------------
import { describe, it, expect, beforeAll } from 'vitest';
import { createBrainTools } from './tools.js';
import { AdapterRegistry } from '../adapters/registry.js';
import type { IExchangeAdapter } from '../adapters/types.js';
import type { OHLCV, ExchangeId, ExchangeCapability } from '../types/index.js';
import type { ToolDefinition } from '../tools/index.js';

// ---------------------------------------------------------------------------
// Mock adapter — returns uptrend candles (60 bars)
// ---------------------------------------------------------------------------

function makeMockAdapter(): IExchangeAdapter {
  const candles: OHLCV[] = Array.from({ length: 60 }, (_, i) => ({
    timestamp: Date.now() - (60 - i) * 3600_000,
    open: 100 + i * 0.5,
    high: 102 + i * 0.5,
    low: 98 + i * 0.5,
    close: 101 + i * 0.5,
    volume: 1000,
  }));

  return {
    exchangeId: 'hyperliquid' as ExchangeId,
    capabilities: new Set<ExchangeCapability>(['spot', 'perpetual']),
    getCandles: async () => candles,
    getTicker: async () => ({
      exchange: 'hyperliquid' as ExchangeId,
      symbol: 'SOL/USDT',
      last: 130,
      bid: 129.9,
      ask: 130.1,
      volume24h: 5_000_000,
      quoteVolume24h: 650_000_000,
      change24h: 2.5,
      changePct24h: 1.96,
      high24h: 132,
      low24h: 126,
      timestamp: Date.now(),
    }),
    getPrice: async () => ({
      exchange: 'hyperliquid' as ExchangeId,
      symbol: 'SOL/USDT',
      price: 130,
      timestamp: Date.now(),
    }),
    getOrderbook: async () => ({
      exchange: 'hyperliquid' as ExchangeId,
      symbol: 'SOL/USDT',
      bids: [],
      asks: [],
      timestamp: Date.now(),
    }),
    getRecentTrades: async () => [],
    getInstruments: async () => [
      {
        exchange: 'hyperliquid' as ExchangeId,
        symbol: 'SOL/USDT',
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        type: 'perpetual' as const,
        tickSize: 0.01,
        lotSize: 0.01,
        minNotional: 1,
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('brain tools', () => {
  let tools: ToolDefinition[];
  let registry: AdapterRegistry;

  beforeAll(() => {
    registry = new AdapterRegistry();
    registry.register(makeMockAdapter());
    tools = createBrainTools({ registry, portfolioValue: 10_000, riskPct: 2 });
  });

  it('creates exactly 7 tools', () => {
    expect(tools).toHaveLength(7);
  });

  it('tool names match brain convention', () => {
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'lucid_execute',
      'lucid_pro',
      'lucid_protect',
      'lucid_review',
      'lucid_scan',
      'lucid_think',
      'lucid_watch',
    ]);
  });

  describe('lucid_think', () => {
    it('returns JSON by default with structured ThinkResult', async () => {
      const think = tools.find((t) => t.name === 'lucid_think')!;
      const result = await think.execute({
        query: 'analyze SOL on hyperliquid',
      });
      // Default format is json — result should be valid JSON
      const parsed = JSON.parse(result);
      expect(parsed.symbol).toContain('SOL');
      expect(['BUY', 'SELL', 'WAIT', 'CLOSE']).toContain(parsed.verdict);
      expect(parsed.schemaVersion).toBe('1.0');
      expect(parsed.score).toBeGreaterThanOrEqual(0);
      expect(parsed.evidence).toBeDefined();
      expect(parsed.rulesTriggered).toBeDefined();
      expect(parsed.provenance).toBeDefined();
      expect(parsed.calibration).toBeDefined();
      expect(parsed.risks).toBeDefined();
    });

    it('returns prose text when format=text', async () => {
      const think = tools.find((t) => t.name === 'lucid_think')!;
      const result = await think.execute({
        query: 'analyze SOL on hyperliquid',
        format: 'text',
      });
      expect(result).toContain('SOL');
      expect(result).toMatch(/BUY|SELL|WAIT|CLOSE/);
      expect(result).toContain('WHY:');
      expect(result).toContain('RISKS:');
      expect(result).toContain('EVIDENCE:');
    });

    it('includes provenance with exchange info in JSON output', async () => {
      const think = tools.find((t) => t.name === 'lucid_think')!;
      const result = await think.execute({
        query: 'analyze SOL on hyperliquid 4h',
      });
      const parsed = JSON.parse(result);
      expect(parsed.provenance.exchange).toBe('hyperliquid');
      expect(parsed.provenance.timeframe).toBe('4h');
      expect(parsed.provenance.candleCount).toBe(60);
    });
  });

  describe('lucid_scan', () => {
    it('returns scan results for available exchanges', async () => {
      const scan = tools.find((t) => t.name === 'lucid_scan')!;
      const result = await scan.execute({ criteria: 'oversold altcoins' });
      expect(result).toContain('Scan:');
    });
  });

  describe('lucid_execute', () => {
    it('returns deferred message', async () => {
      const execute = tools.find((t) => t.name === 'lucid_execute')!;
      const result = await execute.execute({ action: 'buy SOL' });
      expect(result).toContain('deferred');
    });
  });

  describe('lucid_watch', () => {
    it('returns deferred message', async () => {
      const watch = tools.find((t) => t.name === 'lucid_watch')!;
      const result = await watch.execute({
        condition: 'SOL drops below $120',
      });
      expect(result).toContain('deferred');
    });
  });

  describe('lucid_pro', () => {
    it('lists available pro tools when called with list_tools', async () => {
      const pro = tools.find((t) => t.name === 'lucid_pro')!;
      const result = await pro.execute({ tool: 'list_tools' });
      expect(result).toContain('ta_analyze');
      expect(result).toContain('ta_get_rsi');
    });

    it('executes a pro tool directly', async () => {
      const pro = tools.find((t) => t.name === 'lucid_pro')!;
      const result = await pro.execute({
        tool: 'ta_get_rsi',
        params: {
          exchange: 'hyperliquid',
          symbol: 'SOL/USDT',
          timeframe: '4h',
          limit: 60,
        },
      });
      // ta_get_rsi returns JSON with "current", "signal", and "values"
      expect(result).toContain('current');
      expect(result).toContain('signal');
    });

    it('returns error message for unknown tool', async () => {
      const pro = tools.find((t) => t.name === 'lucid_pro')!;
      const result = await pro.execute({ tool: 'nonexistent_tool' });
      expect(result).toContain('not found');
    });
  });

  describe('lucid_protect', () => {
    it('returns risk check with overall level', async () => {
      const protect = tools.find((t) => t.name === 'lucid_protect')!;
      const result = await protect.execute({});
      expect(result).toMatch(/LOW|MEDIUM|HIGH|CRITICAL/);
    });
  });

  describe('lucid_review', () => {
    it('returns performance review', async () => {
      const review = tools.find((t) => t.name === 'lucid_review')!;
      const result = await review.execute({});
      expect(result).toContain('Performance Review');
    });
  });
});
