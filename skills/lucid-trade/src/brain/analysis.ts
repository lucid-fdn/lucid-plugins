// ---------------------------------------------------------------------------
// brain/analysis.ts -- Wire intelligence engine into ThinkResult
// ---------------------------------------------------------------------------
import type { OHLCV } from '../types/index.js';
import type { ThinkResult, Verdict, ThinkEvidence, RuleTriggered, Provenance, CrossoverType } from './types.js';
import {
  sma,
  rsi,
  macd,
  bollingerBands,
  atr,
  historicalVolatility,
} from '../intelligence/indicators.js';
import {
  detectTrend,
  findSupportResistance,
  classifyVolatilityRegime,
  volatilityMultiplier,
} from '../intelligence/trend.js';
import {
  fixedPercentageSize,
  calculateRiskReward,
  calculateLiquidationPrice,
} from '../intelligence/risk-engine.js';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface AnalysisParams {
  symbol: string;
  candles: OHLCV[];
  portfolioValue: number;
  riskPct: number;
  leverage?: number;
  venue?: string;
  exchange?: string;
  timeframe?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely grab the last element from a non-empty number array. */
function last(arr: number[]): number | undefined {
  return arr[arr.length - 1];
}

/** Clamp a value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Round to N decimals. */
function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Safe value extraction — returns 0 for undefined/NaN. */
function val(x: number | undefined): number {
  return x !== undefined && !Number.isNaN(x) ? x : 0;
}

// ---------------------------------------------------------------------------
// Core analysis
// ---------------------------------------------------------------------------

export function runAnalysis(params: AnalysisParams): ThinkResult {
  const {
    symbol,
    candles,
    portfolioValue,
    riskPct,
    leverage = 1,
    venue = 'spot',
  } = params;

  // -- Extract parallel arrays from candles --------------------------------
  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const lastClose = closes[closes.length - 1];

  // Guard: not enough data
  if (lastClose === undefined || candles.length < 30) {
    const zeroedEvidence: ThinkEvidence = {
      rsi: { value: 0, period: 14 },
      macd: { line: 0, signal: 0, histogram: 0, crossover: false, crossoverType: 'none' },
      trend: { type: 'unknown', pctFromSma: 0 },
      bollingerBands: { upper: 0, middle: 0, lower: 0, position: 0 },
      volatility: { regime: 'unknown', hv: 0, atr: 0, atrPct: 0 },
      supports: [],
      resistances: [],
      sma: { sma20: 0, sma50: 0 },
    };
    return {
      schemaVersion: '1.0',
      symbol,
      verdict: 'WAIT',
      score: 0,
      calibration: { type: 'heuristic', isProbability: false },
      invalidation: 'N/A — no active signal',
      evidence: zeroedEvidence,
      rulesTriggered: [],
      rulesetVersion: '1.0.0',
      provenance: {
        exchange: params.exchange ?? params.venue ?? 'unknown',
        timeframe: params.timeframe ?? 'unknown',
        candleCount: candles.length,
        asOf: Date.now(),
      },
      risks: ['Not enough data to make a trading decision.'],
    };
  }

  // -- Run indicators using CORRECT signatures -----------------------------
  const rsiValues = rsi(closes, 14);
  const currentRsi = last(rsiValues);

  const macdResult = macd(closes, 12, 26, 9);
  const currentMacdLine = last(macdResult.macdLine);
  const currentSignal = last(macdResult.signalLine);
  const currentHistogram = last(macdResult.histogram);

  const bb = bollingerBands(closes, 20, 2);
  const bbUpper = last(bb.upper);
  const bbLower = last(bb.lower);
  const bbMiddle = last(bb.middle);

  // atr takes 3 separate arrays, not OHLCV[]
  const atrValues = atr(highs, lows, closes, 14);
  const currentAtr = last(atrValues);

  // detectTrend takes number[], not OHLCV[]
  const trend = detectTrend(closes);

  // findSupportResistance takes OHLCV[]
  const sr = findSupportResistance(candles);

  // historicalVolatility returns a number, then feed it into classifyVolatilityRegime
  const hv = historicalVolatility(closes);
  const volRegime = classifyVolatilityRegime(hv);
  const volMult = volatilityMultiplier(volRegime);

  // Get SMA values for context (detectTrend does not expose them)
  const sma20Values = sma(closes, 20);
  const sma50Values = sma(closes, 50);
  const currentSma20 = last(sma20Values);
  const currentSma50 = last(sma50Values);

  // -- Determine MACD crossover -------------------------------------------
  let macdCrossover = false;
  let macdCrossoverType: CrossoverType = 'none';
  if (macdResult.histogram.length >= 2) {
    const prevHist = macdResult.histogram[macdResult.histogram.length - 2];
    const currHist = currentHistogram;
    if (prevHist !== undefined && currHist !== undefined) {
      if (prevHist <= 0 && currHist > 0) {
        macdCrossover = true;
        macdCrossoverType = 'bullish';
      } else if (prevHist >= 0 && currHist < 0) {
        macdCrossover = true;
        macdCrossoverType = 'bearish';
      }
    }
  }

  // -- Build evidence object ----------------------------------------------
  const atrPct = currentAtr !== undefined ? (currentAtr / lastClose) * 100 : 0;
  const bbRange = val(bbUpper) - val(bbLower);
  const bbPosition = bbRange > 0 ? (lastClose - val(bbLower)) / bbRange : 0;

  const evidence: ThinkEvidence = {
    rsi: { value: val(currentRsi), period: 14 },
    macd: {
      line: val(currentMacdLine),
      signal: val(currentSignal),
      histogram: val(currentHistogram),
      crossover: macdCrossover,
      crossoverType: macdCrossoverType,
    },
    trend: { type: trend.trend, pctFromSma: round(trend.pctAboveFast, 1) },
    bollingerBands: {
      upper: val(bbUpper),
      middle: val(bbMiddle),
      lower: val(bbLower),
      position: round(bbPosition, 2),
    },
    volatility: {
      regime: volRegime,
      hv: round(hv, 1),
      atr: val(currentAtr),
      atrPct: round(atrPct, 1),
    },
    supports: sr.supports,
    resistances: sr.resistances,
    sma: { sma20: val(currentSma20), sma50: val(currentSma50) },
  };

  // -- Build scoring signals & rulesTriggered ------------------------------
  let score = 0; // range roughly -100 to +100
  const rulesTriggered: RuleTriggered[] = [];

  // 1. Trend contribution (+/- 30)
  let trendContribution = 0;
  switch (trend.trend) {
    case 'strong_uptrend':
      trendContribution = 30;
      break;
    case 'uptrend':
      trendContribution = 15;
      break;
    case 'sideways':
      trendContribution = 0;
      break;
    case 'downtrend':
      trendContribution = -15;
      break;
    case 'strong_downtrend':
      trendContribution = -30;
      break;
  }
  score += trendContribution;
  if (trendContribution !== 0) {
    rulesTriggered.push({
      id: 'trend',
      description: `Trend is ${trend.trend} (${trend.pctAboveFast.toFixed(1)}% from fast SMA)`,
      contribution: trendContribution,
      inputs: { trend: trend.trend, pctFromSma: round(trend.pctAboveFast, 1) },
    });
  }

  // 2. RSI contribution (+/- 25)
  const isBearishTrend =
    trend.trend === 'downtrend' || trend.trend === 'strong_downtrend';
  const isBullishTrend =
    trend.trend === 'uptrend' || trend.trend === 'strong_uptrend';

  let rsiContribution = 0;
  let rsiDescription = '';
  if (currentRsi !== undefined) {
    if (currentRsi < 30) {
      rsiContribution = isBearishTrend ? 5 : 25;
      rsiDescription = `RSI(14) = ${currentRsi.toFixed(1)} — oversold${isBearishTrend ? ' (dampened in downtrend)' : ''}`;
    } else if (currentRsi < 40) {
      rsiContribution = isBearishTrend ? 2 : 10;
      rsiDescription = `RSI(14) = ${currentRsi.toFixed(1)} — approaching oversold${isBearishTrend ? ' (dampened in downtrend)' : ''}`;
    } else if (currentRsi > 70) {
      rsiContribution = isBullishTrend ? -5 : -25;
      rsiDescription = `RSI(14) = ${currentRsi.toFixed(1)} — overbought${isBullishTrend ? ' (dampened in uptrend)' : ''}`;
    } else if (currentRsi > 60) {
      rsiContribution = isBullishTrend ? -2 : -10;
      rsiDescription = `RSI(14) = ${currentRsi.toFixed(1)} — approaching overbought${isBullishTrend ? ' (dampened in uptrend)' : ''}`;
    }
  }
  score += rsiContribution;
  if (rsiContribution !== 0) {
    rulesTriggered.push({
      id: 'rsi',
      description: rsiDescription,
      contribution: rsiContribution,
      inputs: { rsi: round(val(currentRsi), 1), isBearishTrend, isBullishTrend },
    });
  }

  // 3. MACD contribution (+/- 20)
  let macdContribution = 0;
  if (currentHistogram !== undefined) {
    if (currentHistogram > 0) {
      macdContribution = 20;
    } else {
      macdContribution = -20;
    }
  }
  score += macdContribution;
  if (macdContribution !== 0) {
    rulesTriggered.push({
      id: 'macd',
      description: `MACD histogram ${currentHistogram! > 0 ? 'bullish' : 'bearish'} (${val(currentHistogram).toFixed(2)})`,
      contribution: macdContribution,
      inputs: {
        histogram: round(val(currentHistogram), 2),
        crossover: macdCrossover,
        crossoverType: macdCrossoverType,
      },
    });
  }

  // 4. Bollinger Band contribution (+/- 15)
  let bbContribution = 0;
  if (bbLower !== undefined && bbUpper !== undefined) {
    if (bbRange > 0) {
      if (bbPosition < 0.2) {
        bbContribution = 15;
      } else if (bbPosition > 0.8) {
        bbContribution = -15;
      }
    }
  }
  score += bbContribution;
  if (bbContribution !== 0) {
    rulesTriggered.push({
      id: 'bb_position',
      description: `Price at BB position ${bbPosition.toFixed(2)} — ${bbContribution > 0 ? 'near lower band' : 'near upper band'}`,
      contribution: bbContribution,
      inputs: { position: round(bbPosition, 2), upper: val(bbUpper), lower: val(bbLower) },
    });
  }

  // 5. Support/resistance context (+/- 10)
  const nearestSupport = sr.supports[0];
  const nearestResistance = sr.resistances[0];
  if (nearestSupport !== undefined) {
    const distToSupport = (lastClose - nearestSupport) / lastClose;
    if (distToSupport < 0.02 && distToSupport > 0) {
      score += 10;
      rulesTriggered.push({
        id: 'sr_support',
        description: `Price near support at $${nearestSupport.toFixed(2)} (${(distToSupport * 100).toFixed(1)}% away)`,
        contribution: 10,
        inputs: { support: nearestSupport, distance: round(distToSupport * 100, 1) },
      });
    }
  }
  if (nearestResistance !== undefined) {
    const distToResistance = (nearestResistance - lastClose) / lastClose;
    if (distToResistance < 0.02 && distToResistance > 0) {
      score -= 10;
      rulesTriggered.push({
        id: 'sr_resistance',
        description: `Price near resistance at $${nearestResistance.toFixed(2)} (${(distToResistance * 100).toFixed(1)}% away)`,
        contribution: -10,
        inputs: { resistance: nearestResistance, distance: round(distToResistance * 100, 1) },
      });
    }
  }

  // -- Determine verdict ---------------------------------------------------
  let verdict: Verdict;
  if (score >= 25) {
    verdict = 'BUY';
  } else if (score <= -25) {
    verdict = 'SELL';
  } else {
    verdict = 'WAIT';
  }

  // -- Score: normalize score to 0-100 ------------------------------------
  const rawScore = Math.abs(score);
  const normalizedScore = clamp(rawScore, 0, 100);

  // -- Build risks ---------------------------------------------------------
  const risks: string[] = [];

  if (volRegime === 'high' || volRegime === 'extreme') {
    risks.push(
      `Volatility regime is ${volRegime} (HV: ${hv.toFixed(1)}%) -- reduce size or stay out`,
    );
  }

  if (currentAtr !== undefined) {
    if (atrPct > 5) {
      risks.push(
        `ATR is ${atrPct.toFixed(1)}% of price -- wide stops needed`,
      );
    }
  }

  if (leverage > 1) {
    const liqSide = verdict === 'SELL' ? 'short' as const : 'long' as const;
    const liqPrice = calculateLiquidationPrice({
      entryPrice: lastClose,
      leverage,
      side: liqSide,
    });
    risks.push(
      `At ${leverage}x leverage, liquidation at $${liqPrice.toFixed(2)}`,
    );
  }

  if (
    currentRsi !== undefined &&
    ((verdict === 'BUY' && currentRsi > 60) ||
      (verdict === 'SELL' && currentRsi < 40))
  ) {
    risks.push('RSI does not confirm the direction -- lower conviction');
  }

  // Always include at least one risk
  if (risks.length === 0) {
    risks.push('General market risk -- always use stops and manage size');
  }

  // -- Position sizing (only for BUY or SELL) ------------------------------
  let how: ThinkResult['how'];

  if (verdict === 'BUY' || verdict === 'SELL') {
    const stopAtr = currentAtr ?? lastClose * 0.02; // fallback 2%
    const stopDistance = stopAtr * 1.5 * (1 / volMult); // wider stops in high vol

    let entry: number;
    let stopLoss: number;
    let takeProfit: number;

    if (verdict === 'BUY') {
      entry = lastClose;
      stopLoss = round(entry - stopDistance);
      takeProfit = round(entry + stopDistance * 2); // 2:1 R:R target
    } else {
      entry = lastClose;
      stopLoss = round(entry + stopDistance);
      takeProfit = round(entry - stopDistance * 2);
    }

    // Position sizing via fixed percentage model
    const actualRiskPct = riskPct * volMult;
    const sizing = fixedPercentageSize({
      portfolioValue,
      riskPct: actualRiskPct,
      entryPrice: entry,
      stopLossPrice: stopLoss,
      maxPositionPct: 25,
    });

    const rr = calculateRiskReward({
      entryPrice: entry,
      stopLossPrice: stopLoss,
      takeProfitPrice: takeProfit,
    });

    how = {
      venue,
      positionValue: round(sizing.positionValue),
      riskPct: round(actualRiskPct, 1),
      capped: sizing.capped,
      entry: round(entry),
      stopLoss,
      takeProfit,
      riskReward: round(rr.ratio, 1),
      riskRewardRating: rr.rating,
      leverage,
    };
  }

  // -- Build invalidation string -------------------------------------------
  let invalidation: string;
  if (verdict === 'BUY' && how) {
    invalidation = `Close below stop loss at $${how.stopLoss} or trend reversal to downtrend`;
  } else if (verdict === 'SELL' && how) {
    invalidation = `Close above stop loss at $${how.stopLoss} or trend reversal to uptrend`;
  } else {
    invalidation = 'N/A — no active signal';
  }

  // -- Build provenance ----------------------------------------------------
  const provenance: Provenance = {
    exchange: params.exchange ?? params.venue ?? 'unknown',
    timeframe: params.timeframe ?? 'unknown',
    candleCount: candles.length,
    asOf: Date.now(),
  };

  return {
    schemaVersion: '1.0',
    symbol,
    verdict,
    score: normalizedScore,
    calibration: { type: 'heuristic', isProbability: false },
    invalidation,
    evidence,
    rulesTriggered,
    rulesetVersion: '1.0.0',
    provenance,
    how,
    risks,
  };
}
