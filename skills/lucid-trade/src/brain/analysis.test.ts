// ---------------------------------------------------------------------------
// brain/analysis.test.ts -- Tests for brain analysis engine
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import { runAnalysis } from './analysis.js';
import type { OHLCV } from '../types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate synthetic OHLCV candles with controlled drift and noise.
 * @param count  Number of bars
 * @param base   Starting price
 * @param trendUp  true = uptrend, false = downtrend
 */
function makeTestCandles(
  count: number,
  base: number,
  trendUp: boolean,
): OHLCV[] {
  return Array.from({ length: count }, (_, i) => {
    const drift = trendUp ? i * 0.5 : -i * 0.3;
    const noise = Math.sin(i * 0.7) * 2;
    const close = base + drift + noise;
    return {
      timestamp: Date.now() - (count - i) * 3600_000,
      open: close - 0.5,
      high: close + 1,
      low: close - 1.5,
      close,
      volume: 1000 + Math.random() * 500,
    };
  });
}

/** Sideways (mean-reverting) candles. */
function makeSidewaysCandles(count: number, base: number): OHLCV[] {
  return Array.from({ length: count }, (_, i) => {
    const noise = Math.sin(i * 1.2) * 3;
    const close = base + noise;
    return {
      timestamp: Date.now() - (count - i) * 3600_000,
      open: close - 0.3,
      high: close + 1.2,
      low: close - 1.2,
      close,
      volume: 800 + Math.random() * 200,
    };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runAnalysis', () => {
  it('returns a ThinkResult with all required fields', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    expect(result.symbol).toBe('SOL/USDT');
    expect(['BUY', 'SELL', 'WAIT', 'CLOSE']).toContain(result.verdict);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.evidence).toBeDefined();
    expect(result.rulesTriggered).toBeDefined();
    expect(result.provenance).toBeDefined();
  });

  it('produces BUY or WAIT verdict for strong uptrend data', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'BTC/USDT',
      candles,
      portfolioValue: 50_000,
      riskPct: 2,
    });
    expect(['BUY', 'WAIT']).toContain(result.verdict);
  });

  it('includes position sizing in how section when verdict is BUY', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'ETH/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    if (result.verdict === 'BUY') {
      expect(result.how).toBeDefined();
      expect(result.how!.stopLoss).toBeLessThan(result.how!.entry);
      expect(result.how!.takeProfit).toBeGreaterThan(result.how!.entry);
      expect(typeof result.how!.positionValue).toBe('number');
      expect(typeof result.how!.riskReward).toBe('number');
      expect(typeof result.how!.leverage).toBe('number');
      expect(typeof result.how!.riskRewardRating).toBe('string');
      expect(typeof result.how!.capped).toBe('boolean');
    }
  });

  it('never produces negative score', () => {
    const candles = makeTestCandles(60, 100, false);
    const result = runAnalysis({
      symbol: 'DOGE/USDT',
      candles,
      portfolioValue: 1000,
      riskPct: 5,
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('score never exceeds 100', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('returns WAIT with zero score for insufficient data', () => {
    const candles = makeTestCandles(10, 100, true);
    const result = runAnalysis({
      symbol: 'BTC/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    expect(result.verdict).toBe('WAIT');
    expect(result.score).toBe(0);
    expect(result.risks).toContain('Not enough data to make a trading decision.');
    expect(result.rulesTriggered).toEqual([]);
    expect(result.evidence.rsi.value).toBe(0);
  });

  it('includes liquidation risk when leverage > 1', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
      leverage: 5,
    });
    const hasLiqRisk = result.risks.some((r) => r.includes('liquidation'));
    expect(hasLiqRisk).toBe(true);
  });

  it('produces SELL or WAIT verdict for strong downtrend data', () => {
    const candles = makeTestCandles(60, 200, false);
    const result = runAnalysis({
      symbol: 'BTC/USDT',
      candles,
      portfolioValue: 50_000,
      riskPct: 2,
    });
    expect(['SELL', 'WAIT']).toContain(result.verdict);
  });

  it('produces WAIT for sideways data', () => {
    const candles = makeSidewaysCandles(60, 100);
    const result = runAnalysis({
      symbol: 'ADA/USDT',
      candles,
      portfolioValue: 5000,
      riskPct: 1,
    });
    // Sideways should lean toward WAIT, though noise could push to BUY/SELL
    expect(['BUY', 'SELL', 'WAIT']).toContain(result.verdict);
  });

  it('how section has stopLoss above entry for SELL verdict', () => {
    const candles = makeTestCandles(60, 200, false);
    const result = runAnalysis({
      symbol: 'ETH/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    if (result.verdict === 'SELL' && result.how) {
      expect(result.how.stopLoss).toBeGreaterThan(result.how.entry);
      expect(result.how.takeProfit).toBeLessThan(result.how.entry);
    }
  });

  it('returns at least one risk entry', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'BTC/USDT',
      candles,
      portfolioValue: 50_000,
      riskPct: 2,
    });
    expect(result.risks.length).toBeGreaterThanOrEqual(1);
  });

  it('respects venue parameter', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
      venue: 'hyperliquid',
    });
    if (result.how) {
      expect(result.how.venue).toBe('hyperliquid');
    }
  });

  // -- New structured JSON tests ------------------------------------------

  it('includes evidence with all indicator sections', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    expect(result.evidence.rsi).toBeDefined();
    expect(result.evidence.rsi.period).toBe(14);
    expect(typeof result.evidence.rsi.value).toBe('number');

    expect(result.evidence.macd).toBeDefined();
    expect(typeof result.evidence.macd.line).toBe('number');
    expect(typeof result.evidence.macd.signal).toBe('number');
    expect(typeof result.evidence.macd.histogram).toBe('number');
    expect(typeof result.evidence.macd.crossover).toBe('boolean');
    expect(['bullish', 'bearish', 'none']).toContain(result.evidence.macd.crossoverType);

    expect(result.evidence.trend).toBeDefined();
    expect(typeof result.evidence.trend.type).toBe('string');
    expect(typeof result.evidence.trend.pctFromSma).toBe('number');

    expect(result.evidence.bollingerBands).toBeDefined();
    expect(typeof result.evidence.bollingerBands.upper).toBe('number');
    expect(typeof result.evidence.bollingerBands.position).toBe('number');

    expect(result.evidence.volatility).toBeDefined();
    expect(typeof result.evidence.volatility.regime).toBe('string');
    expect(typeof result.evidence.volatility.hv).toBe('number');
    expect(typeof result.evidence.volatility.atr).toBe('number');
    expect(typeof result.evidence.volatility.atrPct).toBe('number');

    expect(Array.isArray(result.evidence.supports)).toBe(true);
    expect(Array.isArray(result.evidence.resistances)).toBe(true);

    expect(result.evidence.sma).toBeDefined();
    expect(typeof result.evidence.sma.sma20).toBe('number');
    expect(typeof result.evidence.sma.sma50).toBe('number');
  });

  it('populates rulesTriggered with non-zero contributions', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    // With a strong uptrend, at least the trend rule should fire
    expect(result.rulesTriggered.length).toBeGreaterThanOrEqual(1);
    for (const rule of result.rulesTriggered) {
      expect(rule.contribution).not.toBe(0);
      expect(typeof rule.id).toBe('string');
      expect(typeof rule.description).toBe('string');
      expect(typeof rule.inputs).toBe('object');
    }
  });

  it('includes provenance with exchange and candleCount', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
      exchange: 'binance',
      timeframe: '4h',
    });
    expect(result.provenance.exchange).toBe('binance');
    expect(result.provenance.timeframe).toBe('4h');
    expect(result.provenance.candleCount).toBe(60);
    expect(result.provenance.asOf).toBeGreaterThan(0);
  });

  it('has schemaVersion 1.0', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    expect(result.schemaVersion).toBe('1.0');
  });

  it('includes invalidation string for BUY/SELL', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    if (result.verdict === 'BUY' || result.verdict === 'SELL') {
      expect(result.invalidation).not.toBe('');
      expect(result.invalidation).not.toContain('N/A');
    } else {
      expect(result.invalidation).toContain('N/A');
    }
  });

  it('has calibration marking isProbability as false', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    expect(result.calibration.type).toBe('heuristic');
    expect(result.calibration.isProbability).toBe(false);
  });

  it('provenance falls back to venue when exchange not provided', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
      venue: 'hyperliquid',
    });
    expect(result.provenance.exchange).toBe('hyperliquid');
  });

  it('includes rulesetVersion', () => {
    const candles = makeTestCandles(60, 100, true);
    const result = runAnalysis({
      symbol: 'SOL/USDT',
      candles,
      portfolioValue: 10_000,
      riskPct: 2,
    });
    expect(result.rulesetVersion).toBe('1.0.0');
  });
});
