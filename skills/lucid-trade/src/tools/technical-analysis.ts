// ---------------------------------------------------------------------------
// tools/technical-analysis.ts -- 10 Technical Analysis MCP tools
// ---------------------------------------------------------------------------
// Wraps the intelligence layer (indicators + trend) and exposes them as
// callable MCP tools. Each tool fetches candles from an adapter, runs
// computation, and returns formatted JSON.
// ---------------------------------------------------------------------------

import type { AdapterRegistry } from '../adapters/registry.js';
import type { ExchangeId, OHLCV, Timeframe } from '../types/index.js';
import type { ToolDefinition } from './index.js';
import {
  rsi,
  macd,
  bollingerBands,
  atr,
  ema,
  historicalVolatility,
} from '../intelligence/indicators.js';
import {
  detectTrend,
  findSupportResistance,
  classifyVolatilityRegime,
  volatilityMultiplier,
} from '../intelligence/trend.js';

// ---- Helpers ----------------------------------------------------------------

/** Round a number to `dp` decimal places. */
function round(value: number, dp = 4): number {
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

/** Clamp a number to [min, max]. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Fetch candles from the adapter registry with validation. */
async function fetchCandles(
  registry: AdapterRegistry,
  exchange: string,
  symbol: string,
  timeframe: string,
  limit: number,
): Promise<OHLCV[]> {
  const adapter = registry.get(exchange as ExchangeId);
  if (!adapter) {
    throw new Error(`Exchange "${exchange}" not configured. Register an adapter first.`);
  }
  return adapter.getCandles({
    exchange: exchange as ExchangeId,
    symbol,
    timeframe: timeframe as Timeframe,
    limit,
  });
}

/** Extract close prices from OHLCV bars. */
function closes(bars: OHLCV[]): number[] {
  return bars.map((b) => b.close);
}

/** Extract high prices from OHLCV bars. */
function highs(bars: OHLCV[]): number[] {
  return bars.map((b) => b.high);
}

/** Extract low prices from OHLCV bars. */
function lows(bars: OHLCV[]): number[] {
  return bars.map((b) => b.low);
}

/** Last element of an array, or undefined. */
function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

// ---- Shared param definitions -----------------------------------------------

const exchangeParam = {
  type: 'enum' as const,
  required: true,
  description: 'Exchange to fetch data from',
  values: ['binance', 'bybit', 'okx', 'hyperliquid', 'dydx', 'jupiter', 'raydium'],
};

const symbolParam = {
  type: 'string' as const,
  required: true,
  description: 'Trading pair symbol, e.g. BTC, ETH, SOL',
};

const timeframeParam = {
  type: 'enum' as const,
  required: false,
  description: 'Candlestick timeframe',
  values: ['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1M'],
  default: '1h',
};

const limitParam = {
  type: 'number' as const,
  required: false,
  description: 'Number of candles to fetch',
  default: 100,
  min: 10,
  max: 1000,
};

function baseParams() {
  return {
    exchange: exchangeParam,
    symbol: symbolParam,
    timeframe: timeframeParam,
    limit: limitParam,
  };
}

/** Extract params with defaults applied. */
function parseBaseParams(params: Record<string, unknown>) {
  return {
    exchange: params.exchange as string,
    symbol: params.symbol as string,
    timeframe: (params.timeframe as string) || '1h',
    limit: (params.limit as number) || 100,
  };
}

// ---- RSI signal classification ----------------------------------------------

function rsiSignal(value: number): 'oversold' | 'overbought' | 'neutral' {
  if (value < 30) return 'oversold';
  if (value > 70) return 'overbought';
  return 'neutral';
}

// ---- MACD crossover detection -----------------------------------------------

function detectMacdCrossover(
  macdLine: number[],
  signalLine: number[],
): { crossover: 'bullish' | 'bearish' | 'none'; signal: string } {
  if (macdLine.length < 2 || signalLine.length < 2) {
    return { crossover: 'none', signal: 'Insufficient data for crossover detection' };
  }

  const macdOffset = macdLine.length - signalLine.length;
  const currMacd = macdLine[macdLine.length - 1]!;
  const prevMacd = macdLine[macdLine.length - 2]!;
  const currSignal = signalLine[signalLine.length - 1]!;
  const prevSignal = signalLine[signalLine.length - 2]!;

  if (prevMacd <= prevSignal && currMacd > currSignal) {
    return { crossover: 'bullish', signal: 'MACD crossed above signal line — bullish' };
  }
  if (prevMacd >= prevSignal && currMacd < currSignal) {
    return { crossover: 'bearish', signal: 'MACD crossed below signal line — bearish' };
  }

  if (currMacd > currSignal) {
    return { crossover: 'none', signal: 'MACD above signal — bullish bias' };
  }
  return { crossover: 'none', signal: 'MACD below signal — bearish bias' };
}

// ---- Bollinger signal classification ----------------------------------------

function bollingerSignal(
  price: number,
  upper: number,
  lower: number,
): { signal: string; squeeze: boolean; bandwidth: number; middle: number } {
  const bandwidth = upper - lower;
  const middle = (upper + lower) / 2;
  const squeeze = bandwidth / middle < 0.04; // < 4% bandwidth = squeeze

  let signal: string;
  if (price > upper) {
    signal = 'Price above upper band — overbought / breakout';
  } else if (price < lower) {
    signal = 'Price below lower band — oversold / breakdown';
  } else if (squeeze) {
    signal = 'Bollinger squeeze — expect volatility expansion';
  } else {
    signal = 'Price within bands — neutral';
  }

  return { signal, squeeze, bandwidth: round(bandwidth), middle: round(middle) };
}

// ---- Confidence scoring -----------------------------------------------------

interface ConfidenceInput {
  rsiValue: number;
  macdHistogram: number;
  price: number;
  bollingerUpper: number;
  bollingerLower: number;
  trend: string;
}

function computeConfidence(input: ConfidenceInput): {
  confidence: number;
  recommendation: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
} {
  let score = 50;

  // RSI contribution
  if (input.rsiValue < 30) score += 15;
  else if (input.rsiValue > 70) score -= 15;

  // MACD histogram contribution
  if (input.macdHistogram > 0) score += 10;
  else if (input.macdHistogram < 0) score -= 10;

  // Bollinger contribution
  if (input.price < input.bollingerLower) score += 10;
  else if (input.price > input.bollingerUpper) score -= 10;

  // Trend contribution
  if (input.trend === 'strong_uptrend' || input.trend === 'uptrend') score += 15;
  else if (input.trend === 'strong_downtrend' || input.trend === 'downtrend') score -= 15;

  const confidence = clamp(score, 0, 100);

  let recommendation: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
  if (confidence >= 80) recommendation = 'strong_buy';
  else if (confidence >= 60) recommendation = 'buy';
  else if (confidence >= 40) recommendation = 'neutral';
  else if (confidence >= 20) recommendation = 'sell';
  else recommendation = 'strong_sell';

  return { confidence, recommendation };
}

// ---- Internal full analysis (shared between ta_analyze + ta_score_setup) ----

async function runFullAnalysis(
  registry: AdapterRegistry,
  exchange: string,
  symbol: string,
  timeframe: string,
  limit: number,
) {
  const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
  const closeArr = closes(bars);
  const highArr = highs(bars);
  const lowArr = lows(bars);
  const currentPrice = closeArr[closeArr.length - 1]!;

  // RSI
  const rsiValues = rsi(closeArr);
  const currentRsi = last(rsiValues) ?? 50;
  const rsiSig = rsiSignal(currentRsi);

  // MACD
  const macdResult = macd(closeArr);
  const currentHistogram = last(macdResult.histogram) ?? 0;
  const currentMacdLine = last(macdResult.macdLine) ?? 0;
  const currentSignalLine = last(macdResult.signalLine) ?? 0;
  const macdCross = detectMacdCrossover(macdResult.macdLine, macdResult.signalLine);

  // Bollinger Bands
  const bbResult = bollingerBands(closeArr);
  const currentUpper = last(bbResult.upper) ?? currentPrice;
  const currentLower = last(bbResult.lower) ?? currentPrice;
  const currentMiddle = last(bbResult.middle) ?? currentPrice;
  const bbSig = bollingerSignal(currentPrice, currentUpper, currentLower);

  // Trend
  const trendResult = detectTrend(closeArr);

  // Support/Resistance
  const srResult = findSupportResistance(bars);
  const topSupports = srResult.supports.slice(0, 5);
  const topResistances = srResult.resistances.slice(0, 5);

  // ATR
  const atrValues = atr(highArr, lowArr, closeArr);
  const currentAtr = last(atrValues) ?? 0;
  const atrPct = currentPrice > 0 ? (currentAtr / currentPrice) * 100 : 0;

  // Volatility
  const hv = historicalVolatility(closeArr);
  const regime = classifyVolatilityRegime(hv);
  const volMult = volatilityMultiplier(regime);

  // Confidence
  const { confidence, recommendation } = computeConfidence({
    rsiValue: currentRsi,
    macdHistogram: currentHistogram,
    price: currentPrice,
    bollingerUpper: currentUpper,
    bollingerLower: currentLower,
    trend: trendResult.trend,
  });

  return {
    exchange,
    symbol,
    timeframe,
    price: round(currentPrice),
    rsi: {
      value: round(currentRsi),
      signal: rsiSig,
    },
    macd: {
      macdLine: round(currentMacdLine),
      signalLine: round(currentSignalLine),
      histogram: round(currentHistogram),
      crossover: macdCross.crossover,
      signal: macdCross.signal,
    },
    bollingerBands: {
      upper: round(currentUpper),
      middle: round(currentMiddle),
      lower: round(currentLower),
      bandwidth: bbSig.bandwidth,
      squeeze: bbSig.squeeze,
      signal: bbSig.signal,
    },
    trend: {
      classification: trendResult.trend,
      pctAboveFast: round(trendResult.pctAboveFast),
    },
    supportResistance: {
      supports: topSupports.map(round),
      resistances: topResistances.map(round),
    },
    atr: {
      value: round(currentAtr),
      pct: round(atrPct),
    },
    volatility: {
      historicalVol: round(hv),
      regime,
      positionMultiplier: volMult,
    },
    confidence,
    recommendation,
  };
}

// ---- Tool factory -----------------------------------------------------------

/**
 * Create 10 Technical Analysis MCP tools.
 *
 * Each tool fetches candles via the adapter registry, runs intelligence
 * functions, and returns formatted JSON.
 */
export function createTaTools(registry: AdapterRegistry): ToolDefinition[] {
  // ---- 1. ta_analyze --------------------------------------------------------

  const taAnalyze: ToolDefinition = {
    name: 'ta_analyze',
    description:
      'Full technical analysis report combining RSI, MACD, Bollinger Bands, trend, ' +
      'support/resistance, ATR, volatility regime, confidence score, and recommendation.',
    params: baseParams(),
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);
      const result = await runFullAnalysis(registry, exchange, symbol, timeframe, limit);
      return JSON.stringify(result, null, 2);
    },
  };

  // ---- 2. ta_get_rsi --------------------------------------------------------

  const taGetRsi: ToolDefinition = {
    name: 'ta_get_rsi',
    description:
      'Relative Strength Index with configurable period. Returns current value, ' +
      'signal (oversold/overbought/neutral), and last 20 values.',
    params: {
      ...baseParams(),
      period: {
        type: 'number',
        required: false,
        description: 'RSI period (default 14)',
        default: 14,
        min: 2,
        max: 100,
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);
      const period = (params.period as number) || 14;

      const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
      const closeArr = closes(bars);
      const rsiValues = rsi(closeArr, period);

      const currentValue = last(rsiValues) ?? 0;
      const signal = rsiSignal(currentValue);
      const last20 = rsiValues.slice(-20).map(round);

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          period,
          current: round(currentValue),
          signal,
          values: last20,
        },
        null,
        2,
      );
    },
  };

  // ---- 3. ta_get_macd -------------------------------------------------------

  const taGetMacd: ToolDefinition = {
    name: 'ta_get_macd',
    description:
      'MACD (12, 26, 9). Returns MACD line, signal line, histogram, ' +
      'crossover detection, and signal interpretation.',
    params: baseParams(),
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);

      const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
      const closeArr = closes(bars);
      const macdResult = macd(closeArr);

      const currentMacdLine = last(macdResult.macdLine) ?? 0;
      const currentSignalLine = last(macdResult.signalLine) ?? 0;
      const currentHistogram = last(macdResult.histogram) ?? 0;
      const crossover = detectMacdCrossover(macdResult.macdLine, macdResult.signalLine);

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          macdLine: round(currentMacdLine),
          signalLine: round(currentSignalLine),
          histogram: round(currentHistogram),
          crossover: crossover.crossover,
          signal: crossover.signal,
          histogramLast10: macdResult.histogram.slice(-10).map(round),
        },
        null,
        2,
      );
    },
  };

  // ---- 4. ta_get_bollinger --------------------------------------------------

  const taGetBollinger: ToolDefinition = {
    name: 'ta_get_bollinger',
    description:
      'Bollinger Bands (20, 2). Returns upper/middle/lower bands, bandwidth, ' +
      'squeeze detection, and signal interpretation.',
    params: baseParams(),
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);

      const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
      const closeArr = closes(bars);
      const currentPrice = closeArr[closeArr.length - 1]!;
      const bbResult = bollingerBands(closeArr);

      const currentUpper = last(bbResult.upper) ?? currentPrice;
      const currentLower = last(bbResult.lower) ?? currentPrice;
      const currentMiddle = last(bbResult.middle) ?? currentPrice;
      const bbSig = bollingerSignal(currentPrice, currentUpper, currentLower);

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          price: round(currentPrice),
          upper: round(currentUpper),
          middle: round(currentMiddle),
          lower: round(currentLower),
          bandwidth: bbSig.bandwidth,
          squeeze: bbSig.squeeze,
          signal: bbSig.signal,
        },
        null,
        2,
      );
    },
  };

  // ---- 5. ta_get_trend ------------------------------------------------------

  const taGetTrend: ToolDefinition = {
    name: 'ta_get_trend',
    description:
      'Trend detection via SMA 20/50 crossover. Returns trend classification ' +
      '(strong_uptrend, uptrend, sideways, downtrend, strong_downtrend) and pctAboveFast.',
    params: baseParams(),
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);

      const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
      const closeArr = closes(bars);
      const trendResult = detectTrend(closeArr);

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          trend: trendResult.trend,
          pctAboveFast: round(trendResult.pctAboveFast),
        },
        null,
        2,
      );
    },
  };

  // ---- 6. ta_get_support_resistance -----------------------------------------

  const taGetSupportResistance: ToolDefinition = {
    name: 'ta_get_support_resistance',
    description:
      'Find support and resistance levels using swing highs/lows. ' +
      'Returns top 5 supports (descending) and top 5 resistances (ascending).',
    params: baseParams(),
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);

      const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
      const closeArr = closes(bars);
      const currentPrice = closeArr[closeArr.length - 1]!;
      const srResult = findSupportResistance(bars);

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          price: round(currentPrice),
          supports: srResult.supports.slice(0, 5).map(round),
          resistances: srResult.resistances.slice(0, 5).map(round),
        },
        null,
        2,
      );
    },
  };

  // ---- 7. ta_get_volatility_regime ------------------------------------------

  const taGetVolatilityRegime: ToolDefinition = {
    name: 'ta_get_volatility_regime',
    description:
      'Historical volatility analysis with regime classification (low/moderate/high/extreme) ' +
      'and position sizing multiplier.',
    params: baseParams(),
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);

      const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
      const closeArr = closes(bars);

      const hv = historicalVolatility(closeArr);
      const regime = classifyVolatilityRegime(hv);
      const mult = volatilityMultiplier(regime);

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          historicalVolatility: round(hv),
          regime,
          positionMultiplier: mult,
        },
        null,
        2,
      );
    },
  };

  // ---- 8. ta_get_atr --------------------------------------------------------

  const taGetAtr: ToolDefinition = {
    name: 'ta_get_atr',
    description:
      'Average True Range with ATR% and suggested stop distance (1.5x ATR).',
    params: baseParams(),
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);

      const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
      const closeArr = closes(bars);
      const highArr = highs(bars);
      const lowArr = lows(bars);
      const currentPrice = closeArr[closeArr.length - 1]!;

      const atrValues = atr(highArr, lowArr, closeArr);
      const currentAtr = last(atrValues) ?? 0;
      const atrPct = currentPrice > 0 ? (currentAtr / currentPrice) * 100 : 0;
      const suggestedStop = currentAtr * 1.5;

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          price: round(currentPrice),
          atr: round(currentAtr),
          atrPct: round(atrPct),
          suggestedStopDistance: round(suggestedStop),
          suggestedStopLong: round(currentPrice - suggestedStop),
          suggestedStopShort: round(currentPrice + suggestedStop),
        },
        null,
        2,
      );
    },
  };

  // ---- 9. ta_get_ema_crossover ----------------------------------------------

  const taGetEmaCrossover: ToolDefinition = {
    name: 'ta_get_ema_crossover',
    description:
      'Configurable fast/slow EMA crossover detection. Returns current EMA values, ' +
      'crossover status, and signal.',
    params: {
      ...baseParams(),
      fastPeriod: {
        type: 'number',
        required: false,
        description: 'Fast EMA period (default 9)',
        default: 9,
        min: 2,
        max: 100,
      },
      slowPeriod: {
        type: 'number',
        required: false,
        description: 'Slow EMA period (default 21)',
        default: 21,
        min: 5,
        max: 200,
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);
      const fastPeriod = (params.fastPeriod as number) || 9;
      const slowPeriod = (params.slowPeriod as number) || 21;

      if (fastPeriod >= slowPeriod) {
        throw new Error('fastPeriod must be less than slowPeriod');
      }

      const bars = await fetchCandles(registry, exchange, symbol, timeframe, limit);
      const closeArr = closes(bars);

      const fastEma = ema(closeArr, fastPeriod);
      const slowEma = ema(closeArr, slowPeriod);

      const currentFast = last(fastEma) ?? 0;
      const currentSlow = last(slowEma) ?? 0;

      // Crossover detection
      let crossover: 'bullish' | 'bearish' | 'none' = 'none';
      let signal = 'No crossover';

      if (fastEma.length >= 2 && slowEma.length >= 2) {
        // Align arrays — fastEma has more elements than slowEma
        const fastOffset = fastEma.length - slowEma.length;
        const prevFast = fastEma[fastEma.length - 2]!;
        const prevSlow = slowEma[slowEma.length - 2]!;

        if (prevFast <= prevSlow && currentFast > currentSlow) {
          crossover = 'bullish';
          signal = `EMA(${fastPeriod}) crossed above EMA(${slowPeriod}) — bullish`;
        } else if (prevFast >= prevSlow && currentFast < currentSlow) {
          crossover = 'bearish';
          signal = `EMA(${fastPeriod}) crossed below EMA(${slowPeriod}) — bearish`;
        } else if (currentFast > currentSlow) {
          signal = `EMA(${fastPeriod}) above EMA(${slowPeriod}) — bullish bias`;
        } else {
          signal = `EMA(${fastPeriod}) below EMA(${slowPeriod}) — bearish bias`;
        }
      }

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          fastPeriod,
          slowPeriod,
          fastEma: round(currentFast),
          slowEma: round(currentSlow),
          spread: round(currentFast - currentSlow),
          crossover,
          signal,
        },
        null,
        2,
      );
    },
  };

  // ---- 10. ta_score_setup ---------------------------------------------------

  const taScoreSetup: ToolDefinition = {
    name: 'ta_score_setup',
    description:
      'Composite trade setup score (0-100) combining RSI, MACD, Bollinger Bands, ' +
      'and trend analysis. Returns score and recommendation ' +
      '(strong_buy/buy/neutral/sell/strong_sell).',
    params: baseParams(),
    execute: async (params: Record<string, unknown>) => {
      const { exchange, symbol, timeframe, limit } = parseBaseParams(params);

      // Delegate to the shared full analysis to avoid code duplication
      const analysis = await runFullAnalysis(registry, exchange, symbol, timeframe, limit);

      return JSON.stringify(
        {
          exchange,
          symbol,
          timeframe,
          price: analysis.price,
          confidence: analysis.confidence,
          recommendation: analysis.recommendation,
          components: {
            rsi: {
              value: analysis.rsi.value,
              signal: analysis.rsi.signal,
            },
            macd: {
              histogram: analysis.macd.histogram,
              crossover: analysis.macd.crossover,
            },
            bollingerBands: {
              signal: analysis.bollingerBands.signal,
              squeeze: analysis.bollingerBands.squeeze,
            },
            trend: analysis.trend.classification,
            volatility: analysis.volatility.regime,
          },
        },
        null,
        2,
      );
    },
  };

  return [
    taAnalyze,
    taGetRsi,
    taGetMacd,
    taGetBollinger,
    taGetTrend,
    taGetSupportResistance,
    taGetVolatilityRegime,
    taGetAtr,
    taGetEmaCrossover,
    taScoreSetup,
  ];
}
