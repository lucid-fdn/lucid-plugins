// ---------------------------------------------------------------------------
// status.ts -- System health and statistics
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig, ProviderRegistry } from '../types/index.js';
import { countEvents, getUniqueUsers } from '../db/events.js';
import { getMetricCount } from '../db/metrics.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from '../plugin-id.js';
import { formatNumber } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createStatusTool(deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'metrics_status',
    description:
      'System health and statistics: event count, metric definitions, provider status, and configuration overview.',
    params: {},
    execute: async (): Promise<string> => {
      try {
        const [eventCount, uniqueUsers, metricCount] = await Promise.all([
          countEvents(deps.config.tenantId).catch(() => -1),
          getUniqueUsers(deps.config.tenantId).catch(() => -1),
          getMetricCount(deps.config.tenantId).catch(() => -1),
        ]);

        const configuredProviders = deps.providerRegistry.getConfigured();

        const lines = [
          `## ${PLUGIN_NAME} v${PLUGIN_VERSION}`,
          '',
          '### Providers',
          `- Configured: ${configuredProviders.length}/${deps.providerRegistry.providers.length}`,
          `- Active: ${configuredProviders.map((p) => p.name).join(', ') || 'None'}`,
          '',
          '### Database',
          `- Total events: ${eventCount >= 0 ? formatNumber(eventCount) : 'Not connected'}`,
          `- Unique users: ${uniqueUsers >= 0 ? formatNumber(uniqueUsers) : 'Not connected'}`,
          `- Metric definitions: ${metricCount >= 0 ? metricCount : 'Not connected'}`,
          '',
          '### Configuration',
          `- Tenant: ${deps.config.tenantId}`,
          `- Report schedule: ${deps.config.reportSchedule}`,
          `- Retention window: ${deps.config.retentionWindow} days`,
          `- Slack webhook: ${deps.config.slackWebhookUrl ? 'Configured' : 'Not configured'}`,
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_status failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
