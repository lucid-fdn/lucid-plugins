// ---------------------------------------------------------------------------
// index.ts -- Barrel exports for @lucid-fdn/trade
// ---------------------------------------------------------------------------

// Default export: OpenClaw plugin registration
export { default } from './openclaw.js';

// MCP server factory
export { createTradeServer } from './mcp.js';

// Plugin identity
export { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DESCRIPTION } from './plugin-id.js';

// Types
export type {
  ExchangeId,
  Chain,
  AssetType,
  OrderSide,
  OrderType,
  PositionSide,
  Timeframe,
  ExchangeCapability,
  OHLCV,
  OrderbookLevel,
  Orderbook,
  FundingRate,
  OpenInterest,
  Price,
  Instrument,
  Ticker,
  Trade,
  CandleParams,
  Position,
  Order,
  ClosedTrade,
  Balance,
  OpenPositionParams,
  ClosePositionParams,
  OrderParams,
  OrderResult,
  SpotSwapParams,
  SwapQuote,
  RiskLevel,
  AllocationEntry,
  PerformanceMetrics,
  PortfolioOverview,
  TraderProfile,
} from './types/index.js';

// Adapter types
export type { IExchangeAdapter, AdapterConfig } from './adapters/types.js';

// Adapter registry
export { AdapterRegistry } from './adapters/registry.js';

// Tool types
export type { ToolDefinition, ToolParamDef } from './tools/index.js';

// Config
export { loadConfig } from './config.js';
export type { PluginConfig } from './config.js';

// Brain layer
export { createBrainTools, runAnalysis } from './brain/index.js';
export type {
  ThinkResult, ThinkEvidence, ThinkHow, RuleTriggered, Provenance, CrossoverType,
  ScanResult, ScanItem, ExecuteResult,
  WatchResult, ProtectResult, ProtectCheck, ReviewResult,
  Verdict, BrainContext, AnalysisParams, BrainDeps,
} from './brain/index.js';

// Domain adapter (for brain SDK integration)
export { tradeDomain } from './domain.js';
