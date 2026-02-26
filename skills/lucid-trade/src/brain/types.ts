// ---------------------------------------------------------------------------
// brain/types.ts -- Brain tool type definitions
// ---------------------------------------------------------------------------

/** Verdict the brain produces for think() */
export type Verdict = 'BUY' | 'SELL' | 'WAIT' | 'CLOSE';

/** MACD crossover direction */
export type CrossoverType = 'bullish' | 'bearish' | 'none';

/** Evidence: raw indicator values computed during analysis */
export interface ThinkEvidence {
  rsi: { value: number; period: number };
  macd: { line: number; signal: number; histogram: number; crossover: boolean; crossoverType: CrossoverType };
  trend: { type: string; pctFromSma: number };
  bollingerBands: { upper: number; middle: number; lower: number; position: number };
  volatility: { regime: string; hv: number; atr: number; atrPct: number };
  supports: number[];
  resistances: number[];
  sma: { sma20: number; sma50: number };
}

/** A single rule that contributed to the scoring */
export interface RuleTriggered {
  id: string;
  description: string;
  contribution: number;
  inputs: Record<string, number | boolean | string>;
}

/** Where the data came from */
export interface Provenance {
  exchange: string;
  timeframe: string;
  candleCount: number;
  asOf: number; // Unix timestamp ms
}

/** Position sizing details (only present for BUY/SELL) */
export interface ThinkHow {
  venue: string;
  positionValue: number;   // numeric, not "$600"
  riskPct: number;         // actual risk % used (scaled by vol)
  capped: boolean;         // whether position was capped at 25%
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;      // numeric, not "2.2:1"
  riskRewardRating: string; // "excellent", "good", "poor"
  leverage: number;        // numeric, not "5x"
}

/** Full analysis result from think() — structured JSON contract */
export interface ThinkResult {
  schemaVersion: '1.0';
  symbol: string;
  verdict: Verdict;
  score: number;           // 0-100, was "confidence"
  calibration: { type: 'heuristic'; isProbability: false };
  invalidation: string;    // what would invalidate this signal
  evidence: ThinkEvidence;
  rulesTriggered: RuleTriggered[];
  rulesetVersion: string;
  provenance: Provenance;
  how?: ThinkHow;
  risks: string[];
}

/** Scan result — list of opportunities */
export interface ScanItem {
  symbol: string;
  exchange: string;
  signal: string; // "breakout", "oversold bounce", etc.
  confidence: number;
  volume24h?: number;
  priceChange24h?: number;
}

export interface ScanResult {
  criteria: string;
  matches: ScanItem[];
  scannedExchanges: string[];
  scannedPairs: number;
}

/** Execute result */
export interface ExecuteResult {
  status: 'executed' | 'rejected' | 'needs_confirmation';
  reason?: string;
  orderId?: string;
  exchange?: string;
  symbol?: string;
  side?: string;
  size?: number;
  price?: number;
}

/** Watch result */
export interface WatchResult {
  alertId: string;
  type: 'price' | 'pnl' | 'drawdown' | 'custom';
  condition: string;
  status: 'active';
}

/** Protect risk check */
export interface ProtectCheck {
  name: string;
  status: 'ok' | 'warning' | 'danger';
  detail: string;
}

export interface ProtectResult {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  checks: ProtectCheck[];
}

/** Review performance */
export interface ReviewResult {
  period: string;
  totalPnl: string;
  winRate: string;
  sharpe: number;
  bestSetup: string;
  worstSetup: string;
  suggestion: string;
}

/** Context passed to domain adapter methods */
export interface BrainContext {
  /** User identity (empty string in standalone MCP mode) */
  userId: string;
  /** User preferences loaded from memory (empty array if no memory) */
  preferences: string[];
  /** Available exchanges in the registry */
  exchanges: string[];
}
