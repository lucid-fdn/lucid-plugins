// ---------------------------------------------------------------------------
// index.ts -- Barrel exports for @lucid-fdn/predict
// ---------------------------------------------------------------------------

// Default export: OpenClaw plugin registration
export { default } from './openclaw.js';

// MCP server factory
export { createPredictServer } from './mcp.js';

// Plugin identity
export { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DESCRIPTION } from './plugin-id.js';

// Types
export type {
  PlatformId,
  Market,
  Outcome,
  PricePoint,
  ResolvedMarket,
  MatchedPair,
  OddsFormat,
  Forecast,
  ResolutionType,
  MarketStatus,
  MarketCategory,
} from './types/index.js';

// Math
export {
  expectedValue,
  kellyFraction,
  convertOdds,
  impliedProbability,
  analyzeEfficiency,
  liquidityScore,
  daysToClose,
  timeDecayScore,
  isNearCertainExpiry,
  estimateProbability,
  bayesianUpdate,
  brierScore,
  calibrationBuckets,
  overconfidenceScore,
  titleSimilarity,
  matchMarkets,
  calculateSpread,
  calculateArbitrage,
} from './math/index.js';

export type {
  EvResult,
  KellyResult,
  EfficiencyResult,
  LiquidityResult,
  Adjustment,
  CalibrationBucket,
} from './math/index.js';

// Adapter types
export type { IPlatformAdapter } from './adapters/types.js';

// Adapter registry
export { PlatformRegistry } from './adapters/registry.js';

// Concrete adapters
export { PolymarketAdapter } from './adapters/polymarket.js';
export { ManifoldAdapter } from './adapters/manifold.js';
export { KalshiAdapter } from './adapters/kalshi.js';

// Tool types
export type { ToolDefinition, ToolParamDef } from './tools/index.js';
export { createAllTools } from './tools/index.js';

// Config
export { loadConfig } from './config.js';
export type { PluginConfig } from './config.js';

// Brain layer
export {
  createBrainTools,
  runEvaluation,
  formatEvaluateResult,
  formatDiscoverResult,
  formatArbitrageResult,
  formatCalibrateResult,
} from './brain/index.js';

export type {
  MarketVerdict,
  EdgeType,
  EvaluateResult,
  EvaluateEvidence,
  EvaluationParams,
  DiscoverResult,
  DiscoverItem,
  ArbitrageResult,
  ArbitrageOpportunity,
  CorrelateResult,
  CorrelatedPair,
  SizeResult,
  PositionAllocation,
  CalibrateResult,
  BrainDeps,
} from './brain/index.js';

// Domain adapter (for brain SDK integration)
export { predictDomain } from './domain.js';
