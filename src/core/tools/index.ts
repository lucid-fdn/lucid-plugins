// ---------------------------------------------------------------------------
// index.ts -- Create all Feedback tools
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { createSubmitTool } from './submit.js';
import { createListTool } from './list.js';
import { createAnalyzeSentimentTool } from './analyze-sentiment.js';
import { createGetNpsTool } from './get-nps.js';
import { createGetCsatTool } from './get-csat.js';
import { createTrackFeatureRequestTool } from './track-feature-request.js';
import { createListFeatureRequestsTool } from './list-feature-requests.js';
import { createGetTrendsTool } from './get-trends.js';
import { createCategorizeTool } from './categorize-tool.js';
import { createGetInsightsTool } from './get-insights.js';
import { createCreateSurveyTool } from './create-survey.js';
import { createStatusTool } from './status.js';

export interface ToolDependencies {
  config: PluginConfig;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createSubmitTool(deps),
    createListTool(deps),
    createAnalyzeSentimentTool(deps),
    createGetNpsTool(deps),
    createGetCsatTool(deps),
    createTrackFeatureRequestTool(deps),
    createListFeatureRequestsTool(deps),
    createGetTrendsTool(deps),
    createCategorizeTool(deps),
    createGetInsightsTool(deps),
    createCreateSurveyTool(deps),
    createStatusTool(deps),
  ];
}

export type { ToolDefinition, ToolParamDef } from './types.js';
