// ---------------------------------------------------------------------------
// index.ts -- Create all Meet tools
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { createAnalyzeTranscriptTool } from './analyze-transcript.js';
import { createExtractActionItemsTool } from './extract-action-items.js';
import { createCreateSummaryTool } from './create-summary.js';
import { createTrackFollowUpTool } from './track-followup.js';
import { createListMeetingsTool } from './list-meetings.js';
import { createSearchMeetingsTool } from './search-meetings.js';
import { createGetParticipantStatsTool } from './get-participant-stats.js';
import { createDetectSentimentTool } from './detect-sentiment.js';
import { createGenerateAgendaTool } from './generate-agenda.js';
import { createCreateMeetingTool } from './create-meeting.js';
import { createGetInsightsTool } from './get-insights.js';
import { createStatusTool } from './status.js';

export interface ToolDependencies {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

export function createAllTools(deps: ToolDependencies): ToolDefinition[] {
  return [
    createAnalyzeTranscriptTool(deps),
    createExtractActionItemsTool(deps),
    createCreateSummaryTool(deps),
    createTrackFollowUpTool(deps),
    createListMeetingsTool(deps),
    createSearchMeetingsTool(deps),
    createGetParticipantStatsTool(deps),
    createDetectSentimentTool(deps),
    createGenerateAgendaTool(deps),
    createCreateMeetingTool(deps),
    createGetInsightsTool(deps),
    createStatusTool(deps),
  ];
}

export type { ToolDefinition, ToolParamDef } from './types.js';
