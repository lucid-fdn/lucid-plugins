// ---------------------------------------------------------------------------
// index.ts -- Create all Hype tools
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/index.js';
import { createCreateCampaignTool } from './create-campaign.js';
import { createTrackPostTool } from './track-post.js';
import { createGetViralityScoreTool } from './get-virality-score.js';
import { createAnalyzeEngagementTool } from './analyze-engagement.js';
import { createOptimizeContentTool } from './optimize-content.js';
import { createFindInfluencersTool } from './find-influencers.js';
import { createRankInfluencersTool } from './rank-influencers.js';
import { createGetBestTimesTool } from './get-best-times.js';
import { createGetCampaignReportTool } from './get-campaign-report.js';
import { createListCampaignsTool } from './list-campaigns.js';
import { createGetTrendingTopicsTool } from './get-trending-topics.js';
import { createAnalyzeCompetitorTool } from './analyze-competitor.js';
import { createGetContentCalendarTool } from './get-content-calendar.js';
import { createStatusTool } from './status.js';

export interface ToolDependencies {
  config: PluginConfig;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createCreateCampaignTool(deps),
    createTrackPostTool(deps),
    createGetViralityScoreTool(deps),
    createAnalyzeEngagementTool(deps),
    createOptimizeContentTool(deps),
    createFindInfluencersTool(deps),
    createRankInfluencersTool(deps),
    createGetBestTimesTool(deps),
    createGetCampaignReportTool(deps),
    createListCampaignsTool(deps),
    createGetTrendingTopicsTool(deps),
    createAnalyzeCompetitorTool(deps),
    createGetContentCalendarTool(deps),
    createStatusTool(deps),
  ];
}

export type { ToolDefinition, ToolParamDef } from './types.js';
