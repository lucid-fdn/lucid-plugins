// ---------------------------------------------------------------------------
// index.ts -- Barrel exports for @lucid-fdn/quantum
// ---------------------------------------------------------------------------

// Default export: OpenClaw plugin registration
export { default } from './openclaw.js';

// MCP server factory
export { createQuantumServer } from './mcp.js';

// Plugin identity
export { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DESCRIPTION } from './plugin-id.js';

// Types
export type {
  WorkerStatus,
  WorkUnitStatus,
  TargetStatus,
  BatchStatus,
  WalletSoftware,
  ModeInfo,
  WorkerInfo,
  TriagedTarget,
  ModeScore,
  FingerprintResult,
  ProbableMode,
  NarrowedRange,
  CostEntry,
  OptimizeResult,
  BrainBatch,
  GlobalStats,
} from './types/index.js';

// Adapter types
export type { IBqAdapter, AdapterConfig } from './adapters/types.js';

// Adapter registry
export { AdapterRegistry } from './adapters/registry.js';

// Tool types
export type { ToolDefinition, ToolParamDef } from './tools/index.js';

// Config
export { loadConfig } from './config.js';
export type { PluginConfig } from './config.js';

// Brain layer
export { createBrainTools } from './brain/index.js';
export type {
  FleetStatus, FleetVerdict, RiskLevel, ModeAttention,
  TriageResult, TargetInsight, ModeDistribution, NarrowingOpportunity,
  FingerprintInsight, OptimizeInsight,
  StrategyInsight, StrategyPerformance,
  CostInsight,
  ProtectResult, HealthCheck,
  ReviewResult,
  BrainContext,
} from './brain/index.js';

// Domain adapter (for brain SDK integration)
export { quantumDomain } from './domain.js';
