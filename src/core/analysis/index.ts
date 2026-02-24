export {
  classifyIntent,
  calculateDifficulty,
  calculateDifficultyScore,
  groupKeywordsByTopic,
  suggestRelatedKeywords,
  calculateKeywordValue,
  sortByValue,
} from './keyword-analyzer.js';

export {
  analyzeContent,
  checkReadability,
  checkKeywordDensity,
  extractHeadings,
  analyzeHeadings,
  suggestImprovements,
  type ContentScore,
  type HeadingInfo,
} from './content-optimizer.js';

export {
  auditHtml,
  checkMeta,
  checkHeadings as checkHeadingIssues,
  checkImages,
  checkLinks,
  checkSchema,
  checkMobile,
  calculateTechScore,
  createIssue,
  type TechnicalAuditResult,
} from './technical-auditor.js';

export {
  analyzeOverlap,
  findContentGaps,
  calculateOpportunityScore,
  compareVisibility,
  getCompetitorAdvantages,
  type CompetitorOverlap,
  type ContentGap,
  type VisibilityComparison,
} from './competitor-analyzer.js';

export {
  SEO_CONTENT_PROMPT,
  KEYWORD_STRATEGY_PROMPT,
  buildSeoReportPrompt,
  buildContentBriefPrompt,
} from './prompts.js';
