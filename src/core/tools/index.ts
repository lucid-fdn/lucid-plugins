// ---------------------------------------------------------------------------
// index.ts -- Create all SEO tools
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { createResearchKeywordsTool } from './research-keywords.js';
import { createAnalyzeSerpTool } from './analyze-serp.js';
import { createTrackRankingsTool } from './track-rankings.js';
import { createAnalyzeBacklinksTool } from './analyze-backlinks.js';
import { createFindLinkOpportunitiesTool } from './find-link-opportunities.js';
import { createAuditTechnicalTool } from './audit-technical.js';
import { createOptimizeContentTool } from './optimize-content.js';
import { createAnalyzeCompetitorTool } from './analyze-competitor.js';
import { createGetContentBriefTool } from './get-content-brief.js';
import { createFindContentGapsTool } from './find-content-gaps.js';
import { createCheckIndexingTool } from './check-indexing.js';
import { createGetDomainOverviewTool } from './get-domain-overview.js';
import { createGenerateSitemapAnalysisTool } from './generate-sitemap-analysis.js';
import { createStatusTool } from './status.js';

export interface ToolDependencies {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createResearchKeywordsTool(deps),
    createAnalyzeSerpTool(deps),
    createTrackRankingsTool(deps),
    createAnalyzeBacklinksTool(deps),
    createFindLinkOpportunitiesTool(deps),
    createAuditTechnicalTool(deps),
    createOptimizeContentTool(deps),
    createAnalyzeCompetitorTool(deps),
    createGetContentBriefTool(deps),
    createFindContentGapsTool(deps),
    createCheckIndexingTool(deps),
    createGetDomainOverviewTool(deps),
    createGenerateSitemapAnalysisTool(deps),
    createStatusTool(deps),
  ];
}

export type { ToolDefinition, ToolParamDef } from './types.js';
