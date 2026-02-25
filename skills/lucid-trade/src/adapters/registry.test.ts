// ---------------------------------------------------------------------------
// adapters/registry.test.ts -- Tests for AdapterRegistry
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest';
import { AdapterRegistry } from './registry.js';
import type { IExchangeAdapter } from './types.js';
import type { ExchangeCapability } from '../types/index.js';

/** Minimal mock adapter for testing */
function mockAdapter(
  exchangeId: IExchangeAdapter['exchangeId'],
  caps: ExchangeCapability[],
): IExchangeAdapter {
  return {
    exchangeId,
    capabilities: new Set(caps),
    getCandles: async () => [],
    getTicker: async () => ({}) as any,
    getPrice: async () => ({}) as any,
    getOrderbook: async () => ({}) as any,
    getRecentTrades: async () => [],
    getInstruments: async () => [],
  };
}

describe('AdapterRegistry', () => {
  let registry: AdapterRegistry;

  beforeEach(() => {
    registry = new AdapterRegistry();
  });

  it('registers and retrieves an adapter by exchange ID', () => {
    const adapter = mockAdapter('binance', ['spot', 'perpetual', 'ohlcv']);
    registry.register(adapter);

    const retrieved = registry.get('binance');
    expect(retrieved).toBeDefined();
    expect(retrieved!.exchangeId).toBe('binance');
    expect(retrieved!.capabilities.has('spot')).toBe(true);
  });

  it('returns undefined for unknown exchange', () => {
    expect(registry.get('okx')).toBeUndefined();
  });

  it('lists all registered adapters', () => {
    registry.register(mockAdapter('binance', ['spot', 'ohlcv']));
    registry.register(mockAdapter('bybit', ['perpetual', 'ohlcv']));
    registry.register(mockAdapter('jupiter', ['spot']));

    const all = registry.list();
    expect(all).toHaveLength(3);
    expect(registry.size).toBe(3);

    const ids = all.map((a) => a.exchangeId);
    expect(ids).toContain('binance');
    expect(ids).toContain('bybit');
    expect(ids).toContain('jupiter');
  });

  it('filters adapters by capability', () => {
    registry.register(mockAdapter('binance', ['spot', 'perpetual', 'funding_rate']));
    registry.register(mockAdapter('bybit', ['perpetual', 'funding_rate']));
    registry.register(mockAdapter('jupiter', ['spot']));

    const perpAdapters = registry.withCapability('perpetual');
    expect(perpAdapters).toHaveLength(2);

    const fundingAdapters = registry.withCapability('funding_rate');
    expect(fundingAdapters).toHaveLength(2);

    const spotAdapters = registry.withCapability('spot');
    expect(spotAdapters).toHaveLength(2);

    const optionsAdapters = registry.withCapability('options');
    expect(optionsAdapters).toHaveLength(0);
  });
});
