// ---------------------------------------------------------------------------
// brain/types.test.ts -- Tests for brain type formatters
// ---------------------------------------------------------------------------
import { describe, it, expect } from 'vitest';
import {
  formatThinkResult,
  formatScanResult,
  formatProtectResult,
  formatReviewResult,
} from './formatter.js';
import type { ThinkResult } from './types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal ThinkResult for testing the formatter. */
function makeThinkResult(overrides: Partial<ThinkResult> = {}): ThinkResult {
  return {
    schemaVersion: '1.0',
    symbol: 'SOL/USDT',
    verdict: 'BUY',
    score: 72,
    calibration: { type: 'heuristic', isProbability: false },
    invalidation: 'Close below stop loss at $142.2 or trend reversal to downtrend',
    evidence: {
      rsi: { value: 34, period: 14 },
      macd: { line: 1.5, signal: 0.8, histogram: 0.7, crossover: true, crossoverType: 'bullish' },
      trend: { type: 'uptrend', pctFromSma: 2.3 },
      bollingerBands: { upper: 160, middle: 150, lower: 140, position: 0.42 },
      volatility: { regime: 'normal', hv: 35.2, atr: 3.5, atrPct: 2.4 },
      supports: [145],
      resistances: [165],
      sma: { sma20: 149, sma50: 146 },
    },
    rulesTriggered: [
      {
        id: 'trend',
        description: 'Trend is uptrend (2.3% from fast SMA)',
        contribution: 15,
        inputs: { trend: 'uptrend', pctFromSma: 2.3 },
      },
      {
        id: 'rsi',
        description: 'RSI(14) = 34.0 — approaching oversold',
        contribution: 10,
        inputs: { rsi: 34, isBearishTrend: false, isBullishTrend: true },
      },
      {
        id: 'macd',
        description: 'MACD histogram bullish (0.70)',
        contribution: 20,
        inputs: { histogram: 0.7, crossover: true, crossoverType: 'bullish' },
      },
    ],
    rulesetVersion: '1.0.0',
    provenance: {
      exchange: 'hyperliquid',
      timeframe: '4h',
      candleCount: 60,
      asOf: Date.now(),
    },
    how: {
      venue: 'hyperliquid',
      positionValue: 600,
      riskPct: 2,
      capped: false,
      entry: 148.5,
      stopLoss: 142.2,
      takeProfit: 162,
      riskReward: 2.2,
      riskRewardRating: 'excellent',
      leverage: 5,
    },
    risks: [
      'BTC macro downtrend could drag alts',
      'At 5x leverage, liquidation at $134.80',
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('brain formatter', () => {
  describe('formatThinkResult', () => {
    it('formats a complete think result into structured text', () => {
      const result = formatThinkResult(makeThinkResult());
      expect(result).toContain('SOL/USDT');
      expect(result).toContain('BUY');
      expect(result).toContain('72');
      expect(result).toContain('Score:');
      expect(result).toContain('RSI(14)');
      expect(result).toContain('hyperliquid');
      expect(result).toContain('142.2');
      expect(result).toContain('WHY:');
      expect(result).toContain('EVIDENCE:');
      expect(result).toContain('HOW:');
      expect(result).toContain('RISKS:');
    });

    it('formats rulesTriggered with contribution signs', () => {
      const result = formatThinkResult(makeThinkResult());
      expect(result).toContain('[+15]');
      expect(result).toContain('[+10]');
      expect(result).toContain('[+20]');
    });

    it('formats a WAIT verdict without how section', () => {
      const result = formatThinkResult(makeThinkResult({
        verdict: 'WAIT',
        score: 15,
        how: undefined,
        invalidation: 'N/A — no active signal',
        rulesTriggered: [],
      }));
      expect(result).toContain('WAIT');
      expect(result).not.toContain('Entry:');
      expect(result).toContain('No rules triggered');
    });

    it('includes evidence section with indicator values', () => {
      const result = formatThinkResult(makeThinkResult());
      expect(result).toContain('EVIDENCE:');
      expect(result).toContain('Trend: uptrend');
      expect(result).toContain('RSI(14): 34.0');
      expect(result).toContain('MACD:');
      expect(result).toContain('BB:');
      expect(result).toContain('Volatility: normal');
    });

    it('formats how section with numeric values', () => {
      const result = formatThinkResult(makeThinkResult());
      expect(result).toContain('$600');
      expect(result).toContain('2% risk');
      expect(result).toContain('2.2:1');
      expect(result).toContain('excellent');
      expect(result).toContain('5x');
    });

    it('shows "none" for leverage when leverage is 1', () => {
      const result = formatThinkResult(makeThinkResult({
        how: {
          venue: 'spot',
          positionValue: 400,
          riskPct: 2,
          capped: false,
          entry: 100,
          stopLoss: 95,
          takeProfit: 110,
          riskReward: 2,
          riskRewardRating: 'good',
          leverage: 1,
        },
      }));
      expect(result).toContain('Leverage: none');
    });
  });

  describe('formatScanResult', () => {
    it('formats scan matches', () => {
      const result = formatScanResult({
        criteria: 'oversold altcoins',
        matches: [
          { symbol: 'SOL/USDT', exchange: 'hyperliquid', signal: 'oversold bounce', confidence: 78 },
          { symbol: 'AVAX/USDT', exchange: 'hyperliquid', signal: 'bullish setup', confidence: 65 },
        ],
        scannedExchanges: ['hyperliquid'],
        scannedPairs: 10,
      });
      expect(result).toContain('oversold altcoins');
      expect(result).toContain('2 matches');
      expect(result).toContain('SOL/USDT');
      expect(result).toContain('78');
    });

    it('shows empty message when no matches', () => {
      const result = formatScanResult({
        criteria: 'breakout setups',
        matches: [],
        scannedExchanges: ['hyperliquid'],
        scannedPairs: 10,
      });
      expect(result).toContain('0 matches');
      expect(result).toContain('No matches found');
    });
  });

  describe('formatProtectResult', () => {
    it('formats risk check results', () => {
      const result = formatProtectResult({
        overallRisk: 'MEDIUM',
        checks: [
          {
            name: 'Liquidation proximity',
            status: 'ok',
            detail: 'Nearest liquidation 15% away',
          },
          {
            name: 'Concentration',
            status: 'warning',
            detail: 'SOL is 45% of portfolio (>30% threshold)',
          },
        ],
      });
      expect(result).toContain('MEDIUM');
      expect(result).toContain('Concentration');
      expect(result).toContain('WARN');
    });
  });

  describe('formatReviewResult', () => {
    it('formats performance review', () => {
      const result = formatReviewResult({
        period: '30d',
        totalPnl: '+12.3%',
        winRate: '68%',
        sharpe: 1.8,
        bestSetup: 'Breakout (82% win rate)',
        worstSetup: 'Mean reversion (38% win rate)',
        suggestion:
          'Stop taking mean reversion trades — your edge is in breakouts.',
      });
      expect(result).toContain('12.3%');
      expect(result).toContain('68%');
      expect(result).toContain('Breakout');
      expect(result).toContain('Stop taking mean reversion');
    });
  });
});
