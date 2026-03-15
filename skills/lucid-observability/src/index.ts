// ---------------------------------------------------------------------------
// index.ts -- Barrel exports for @lucid-fdn/observability
// ---------------------------------------------------------------------------

// Default export: OpenClaw plugin registration
export { default } from './openclaw.js';

// MCP server factory
export { createObservabilityServer } from './mcp.js';

// Plugin identity
export { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION, PLUGIN_DESCRIPTION } from './plugin-id.js';

// Types
export type {
  Severity,
  TemporalPattern,
  DiagnosisCategory,
  SentryIssue,
  TriageResult,
  ReadinessCheck,
  ReadinessResult,
  OutboxHealth,
  DiagnosisResult,
} from './types/index.js';

// Math
export {
  scoreSeverity,
  detectTemporalPattern,
  diagnoseIssue,
  checkReadiness,
  analyzeOutboxHealth,
} from './math/index.js';

// Tool types
export type { ToolDefinition, ToolParamDef } from './tools/index.js';
export { createAllTools } from './tools/index.js';

// Config
export { loadConfig } from './config.js';
export type { PluginConfig } from './config.js';

// Brain layer
export {
  createBrainTools,
  runTriage,
  formatTriageResult,
  formatReadinessResult,
  formatOutboxResult,
  formatDiagnosisResult,
} from './brain/index.js';

export type {
  BrainDeps,
  TriageParams,
  ReadinessParams,
  OutboxParams,
  DiagnoseParams,
} from './brain/index.js';
