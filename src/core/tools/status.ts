// ---------------------------------------------------------------------------
// status.ts -- System health and statistics
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { countFeedback } from '../db/feedback-items.js';
import { listSurveys } from '../db/surveys.js';
import { countResponses } from '../db/responses.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from '../plugin-id.js';
import { daysAgo } from '../utils/date.js';
import { log } from '../utils/logger.js';

export function createStatusTool(deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_status',
    description:
      'System health and statistics: total feedback count, survey count, response count, configuration status, and scheduler info.',
    params: {},
    execute: async (): Promise<string> => {
      try {
        const [totalFeedback, recentFeedback, surveys, recentResponses] = await Promise.all([
          countFeedback().catch(() => 0),
          countFeedback({ since: daysAgo(7) }).catch(() => 0),
          listSurveys({ limit: 100 }).catch(() => []),
          countResponses({ since: daysAgo(7) }).catch(() => 0),
        ]);

        const activeSurveys = surveys.filter((s) => s.active).length;

        const lines: string[] = [
          `## ${PLUGIN_NAME} v${PLUGIN_VERSION}`,
          '',
          '### Feedback',
          `- Total items: ${totalFeedback}`,
          `- Last 7 days: ${recentFeedback}`,
          '',
          '### Surveys',
          `- Total surveys: ${surveys.length}`,
          `- Active surveys: ${activeSurveys}`,
          '',
          '### Responses',
          `- Last 7 days: ${recentResponses}`,
          '',
          '### Configuration',
          `- Tenant: ${deps.config.tenantId}`,
          `- Collect schedule: ${deps.config.collectSchedule}`,
          `- NPS threshold: ${deps.config.npsThreshold}`,
          `- Slack webhook: ${deps.config.slackWebhookUrl ? 'Configured' : 'Not configured'}`,
          `- Intercom: ${deps.config.intercomApiKey ? 'Configured' : 'Not configured'}`,
          `- Zendesk: ${deps.config.zendeskApiKey ? 'Configured' : 'Not configured'}`,
          `- Typeform: ${deps.config.typeformApiKey ? 'Configured' : 'Not configured'}`,
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_status failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
