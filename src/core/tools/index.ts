// ---------------------------------------------------------------------------
// index.ts -- Create all Metrics tools
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig, ProviderRegistry } from '../types/index.js';
import { createTrackEventTool } from './track-event.js';
import { createQueryMetricTool } from './query-metric.js';
import { createAnalyzeFunnelTool } from './analyze-funnel.js';
import { createGetRetentionTool } from './get-retention.js';
import { createGetActiveUsersTool } from './get-active-users.js';
import { createAnalyzeExperimentTool } from './analyze-experiment.js';
import { createTrackFeatureTool } from './track-feature.js';
import { createGetFeatureAdoptionTool } from './get-feature-adoption.js';
import { createCreateDashboardTool } from './create-dashboard.js';
import { createGetInsightsTool } from './get-insights.js';
import { createComparePeriodsTool } from './compare-periods.js';
import { createStatusTool } from './status.js';

export interface ToolDependencies {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createTrackEventTool(deps),
    createQueryMetricTool(deps),
    createAnalyzeFunnelTool(deps),
    createGetRetentionTool(deps),
    createGetActiveUsersTool(deps),
    createAnalyzeExperimentTool(deps),
    createTrackFeatureTool(deps),
    createGetFeatureAdoptionTool(deps),
    createCreateDashboardTool(deps),
    createGetInsightsTool(deps),
    createComparePeriodsTool(deps),
    createStatusTool(deps),
  ];
}

export type { ToolDefinition, ToolParamDef } from './types.js';
