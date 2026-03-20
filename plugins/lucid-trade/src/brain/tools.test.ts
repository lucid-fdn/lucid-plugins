// ---------------------------------------------------------------------------
// brain/tools.test.ts -- Tests for 5 brain MCP tools
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

function makeMockAdapter(opts?: { withPositions?: boolean }): IExchangeAdapter {
  const candles: OHLCV[] = Array.from({ length: 60 }, (_, i) => ({
    timestamp: Date.now() - (60 - i) * 3600_000,
    open: 100 + i * 0.5,
    high: 102 + i * 0.5,
    low: 98 + i * 0.5,
    close: 101 + i * 0.5,
    volume: 1000,
  }));

  const adapter: IExchangeAdapter = {
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

  if (opts?.withPositions) {
    adapter.getPositions = async () => [
      {
        exchange: 'hyperliquid' as ExchangeId,
        symbol: 'SOL/USDT',
        side: 'long',
        size: 10,
        entryPrice: 120,
        markPrice: 130,
        leverage: 3,
        unrealizedPnl: 100,
        marginUsed: 400,
      },
      {
        exchange: 'hyperliquid' as ExchangeId,
        symbol: 'ETH/USDT',
        side: 'short',
        size: 1,
        entryPrice: 3500,
        markPrice: 3600,
        leverage: 2,
        unrealizedPnl: -100,
        marginUsed: 1750,
      },
    ];
  }

  return adapter;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('brain tools', () => {
  let tools: ToolDefinition[];
  let registry: AdapterRegistry;

  beforeAll(() => {
    registry = new AdapterRegistry();
    registry.register(makeMockAdapter({ withPositions: true }));
    tools = createBrainTools({ registry, portfolioValue: 10_000, riskPct: 2 });
  });

  it('creates exactly 5 tools', () => {
    expect(tools).toHaveLength(5);
  });

  it('tool names match brain convention', () => {
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      'lucid_pro',
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
      const parsed = JSON.parse(result);
      expect(parsed.symbol).toContain('SOL');
      expect(['BUY', 'SELL', 'WAIT', 'CLOSE']).toContain(parsed.verdict);
      expect(parsed.schemaVersion).toBe('1.0');
      expect(parsed.score).toBeGreaterThanOrEqual(0);
      expect(parsed.evidence).toBeDefined();
      expect(parsed.rulesTriggered).toBeDefined();
    });

    it('returns prose text when format=text', async () => {
      const think = tools.find((t) => t.name === 'lucid_think')!;
      const result = await think.execute({
        query: 'analyze SOL on hyperliquid',
        format: 'text',
      });
      expect(result).toContain('SOL');
      expect(result).toMatch(/BUY|SELL|WAIT|CLOSE/);
    });

    it('returns compact JSON when detail=compact', async () => {
      const think = tools.find((t) => t.name === 'lucid_think')!;
      const result = await think.execute({
        query: 'analyze SOL on hyperliquid',
        detail: 'compact',
      });
      const parsed = JSON.parse(result);
      expect(parsed.evidence).toBeUndefined();
      expect(parsed.verdict).toBeDefined();
      expect(parsed.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('lucid_scan', () => {
    it('returns scan results for available exchanges', async () => {
      const scan = tools.find((t) => t.name === 'lucid_scan')!;
      const result = await scan.execute({ criteria: 'oversold altcoins' });
      expect(result).toContain('Scan:');
    });
  });

  describe('lucid_watch', () => {
    it('returns structured cron_schedule instruction', async () => {
      const watch = tools.find((t) => t.name === 'lucid_watch')!;
      const result = await watch.execute({
        condition: 'SOL drops below $120',
      });
      const parsed = JSON.parse(result);
      expect(parsed.status).toBe('ready');
      expect(parsed.watch.symbol).toContain('SOL');
      expect(parsed.watch.condition).toContain('below $120');
      expect(parsed.action.tool).toBe('cron_schedule');
      expect(parsed.action.params.cron_expression).toBeDefined();
      expect(parsed.action.params.task_prompt).toContain('lucid_think');
      expect(parsed.action.params.task_prompt).toContain('SOL');
    });

    it('includes baseline analysis', async () => {
      const watch = tools.find((t) => t.name === 'lucid_watch')!;
      const result = await watch.execute({
        condition: 'SOL RSI < 30',
        interval: '1h',
      });
      const parsed = JSON.parse(result);
      expect(parsed.watch.baseline).toContain('Current:');
      expect(parsed.watch.interval).toBe('1h');
    });

    it('uses custom interval', async () => {
      const watch = tools.find((t) => t.name === 'lucid_watch')!;
      const result = await watch.execute({
        condition: 'BTC drops below $50000',
        interval: '5m',
      });
      const parsed = JSON.parse(result);
      expect(parsed.action.params.cron_expression).toBe('*/5 * * * *');
    });
  });

  describe('lucid_review', () => {
    it('returns summary performance review with positions', async () => {
      const review = tools.find((t) => t.name === 'lucid_review')!;
      const result = await review.execute({});
      expect(result).toContain('Performance Review');
      expect(result).toContain('SOL');
      expect(result).toContain('%');
    });

    it('includes win rate and suggestions', async () => {
      const review = tools.find((t) => t.name === 'lucid_review')!;
      const result = await review.execute({ detail: 'summary' });
      expect(result).toContain('Performance Review');
      // Should have actionable content, not placeholder text
      expect(result).not.toContain('no trades recorded');
      expect(result).not.toContain('no history');
    });

    it('full detail includes AI scoring per position', async () => {
      const review = tools.find((t) => t.name === 'lucid_review')!;
      const result = await review.execute({ detail: 'full' });
      expect(result).toContain('Performance Review');
      // Full mode runs lucid_think on each position
      expect(result).toMatch(/score=\d+/);
    });

    it('handles no exchanges gracefully', async () => {
      const emptyRegistry = new AdapterRegistry();
      const emptyTools = createBrainTools({ registry: emptyRegistry, portfolioValue: 10_000, riskPct: 2 });
      const review = emptyTools.find((t) => t.name === 'lucid_review')!;
      const result = await review.execute({});
      expect(result).toContain('No exchanges connected');
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
      expect(result).toContain('current');
      expect(result).toContain('signal');
    });

    it('returns error message for unknown tool', async () => {
      const pro = tools.find((t) => t.name === 'lucid_pro')!;
      const result = await pro.execute({ tool: 'nonexistent_tool' });
      expect(result).toContain('not found');
    });
  });
});
