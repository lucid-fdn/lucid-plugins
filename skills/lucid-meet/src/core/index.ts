// Types
export * from './types/index.js';

// Config
export { loadConfig, getConfig, resetConfig, CONFIG_DEFAULTS, PluginConfigSchema } from './config/index.js';

// Plugin identity
export { PLUGIN_ID, PLUGIN_NAME, PLUGIN_VERSION } from './plugin-id.js';

// Database
export * from './db/index.js';

// Providers
export { createProviderRegistry } from './providers/index.js';

// Analysis
export {
  extractActionItems,
  extractDecisions,
  extractKeyTopics,
  analyzeSentiment,
  generateSummary,
  scoreMeetingEffectiveness,
  calculateActionCompletionRate,
  identifyBottlenecks,
  measureFollowUpRate,
  buildAgenda,
  suggestTopics,
  estimateDuration,
  MEETING_SUMMARY_PROMPT,
  ACTION_EXTRACTION_PROMPT,
  DECISION_EXTRACTION_PROMPT,
  FOLLOW_UP_PROMPT,
  buildMeetingSummaryPrompt,
  buildTranscriptAnalysisPrompt,
  buildFollowUpPrompt,
} from './analysis/index.js';

// Tools
export { createAllTools } from './tools/index.js';
export type { ToolDefinition, ToolParamDef } from './tools/types.js';
export type { ToolDependencies } from './tools/index.js';

// Services
export { startScheduler, stopScheduler } from './services/index.js';

// Utils
export * from './utils/index.js';
