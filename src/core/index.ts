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
export { BaseProvider } from './providers/base.js';

// Analysis
export {
  classifyIntent,
  calculateDifficulty,
  calculateDifficultyScore,
  groupKeywordsByTopic,
  suggestRelatedKeywords,
  calculateKeywordValue,
  sortByValue,
  analyzeContent,
  checkReadability,
  checkKeywordDensity,
  extractHeadings,
  analyzeHeadings,
  auditHtml,
  checkMeta,
  checkImages,
  checkLinks,
  checkSchema,
  checkMobile,
  calculateTechScore,
  analyzeOverlap,
  findContentGaps,
  calculateOpportunityScore,
  compareVisibility,
  getCompetitorAdvantages,
  SEO_CONTENT_PROMPT,
  KEYWORD_STRATEGY_PROMPT,
  buildSeoReportPrompt,
  buildContentBriefPrompt,
} from './analysis/index.js';

// Tools
export { createAllTools } from './tools/index.js';
export type { ToolDefinition, ToolParamDef } from './tools/types.js';
export type { ToolDependencies } from './tools/index.js';

// Services
export { startScheduler, stopScheduler } from './services/index.js';

// Utils
export * from './utils/index.js';
