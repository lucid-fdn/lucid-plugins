// ---------------------------------------------------------------------------
// brain/index.ts -- Barrel export for brain layer
// ---------------------------------------------------------------------------
export { createBrainTools } from './tools.js';
export type { BrainDeps } from './tools.js';
export { runAnalysis } from './analysis.js';
export type { AnalysisParams } from './analysis.js';
export {
  formatThinkResult,
  formatScanResult,
  formatProtectResult,
  formatReviewResult,
} from './formatter.js';
export type {
  ThinkResult,
  ThinkEvidence,
  ThinkHow,
  RuleTriggered,
  Provenance,
  CrossoverType,
  ScanResult,
  ScanItem,
  ExecuteResult,
  WatchResult,
  ProtectResult,
  ProtectCheck,
  ReviewResult,
  Verdict,
  BrainContext,
} from './types.js';
