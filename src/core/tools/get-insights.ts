// ---------------------------------------------------------------------------
// get-insights.ts -- AI-ready analytics insights
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig, ProviderRegistry } from '../types/index.js';
import { queryEvents, countEvents, getUniqueUsers } from '../db/events.js';
import { listMetrics } from '../db/metrics.js';
import { buildTimeSeries, computeGrowthRate } from '../analysis/metric-calculator.js';
import { METRIC_PERIODS } from '../types/common.js';
import { formatNumber, formatPct } from '../utils/text.js';
import { isoDate, daysAgo } from '../utils/date.js';
import { log } from '../utils/logger.js';

interface GetInsightsParams {
  period?: string;
  focus?: string;
}

export function createGetInsightsTool(deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition<GetInsightsParams> {
  return {
    name: 'metrics_get_insights',
    description:
      'Get AI-ready product analytics insights. Analyzes trends, anomalies, and provides actionable recommendations for the specified period.',
    params: {
      period: {
        type: 'enum',
        required: false,
        description: 'Analysis period',
        values: [...METRIC_PERIODS],
        default: 'week',
      },
      focus: {
        type: 'string',
        required: false,
        description: 'Specific area to focus on (e.g. "onboarding", "purchases", "engagement")',
      },
    },
    execute: async (params: GetInsightsParams): Promise<string> => {
      try {
        const periodDays = params.period === 'day' ? 1 : params.period === 'month' ? 30 : 7;
        const startDate = isoDate(daysAgo(periodDays));
        const endDate = isoDate(new Date());
        const prevStart = isoDate(daysAgo(periodDays * 2));

        // Gather data
        const [totalEvents, prevTotalEvents, uniqueUsers, prevUniqueUsers, metrics] = await Promise.all([
          countEvents(deps.config.tenantId).catch(() => 0),
          countEvents(deps.config.tenantId).catch(() => 0),
          getUniqueUsers(deps.config.tenantId, startDate, endDate).catch(() => 0),
          getUniqueUsers(deps.config.tenantId, prevStart, startDate).catch(() => 0),
          listMetrics(deps.config.tenantId).catch(() => []),
        ]);

        const eventGrowth = computeGrowthRate(totalEvents, prevTotalEvents);
        const userGrowth = computeGrowthRate(uniqueUsers, prevUniqueUsers);

        // Get event breakdown
        const events = await queryEvents({
          tenant_id: deps.config.tenantId,
          start_date: startDate,
          end_date: endDate,
          ...(params.focus ? { event_name: params.focus } : {}),
        }).catch(() => []);

        const timeSeries = buildTimeSeries(events, 'day');

        // Find anomalies (values > 2 std devs from mean)
        const values = timeSeries.map((ts) => ts.value);
        const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const variance =
          values.length > 0 ? values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length : 0;
        const stdDev = Math.sqrt(variance);
        const anomalies = timeSeries.filter((ts) => Math.abs(ts.value - mean) > 2 * stdDev);

        // Event type distribution
        const eventTypeMap = new Map<string, number>();
        for (const event of events) {
          const name = event.event_name;
          eventTypeMap.set(name, (eventTypeMap.get(name) ?? 0) + 1);
        }
        const topEvents = Array.from(eventTypeMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        const configuredProviders = deps.providerRegistry.getConfigured();

        const lines = [
          `## Product Insights${params.focus ? ` (Focus: ${params.focus})` : ''}`,
          '',
          `**Period**: ${startDate} to ${endDate}`,
          '',
          '### Key Metrics',
          `- Total events: ${formatNumber(totalEvents)} (${formatPct(eventGrowth)} growth)`,
          `- Unique users: ${formatNumber(uniqueUsers)} (${formatPct(userGrowth)} growth)`,
          `- Defined metrics: ${metrics.length}`,
          `- Data sources: ${configuredProviders.length} provider(s) configured`,
          '',
          '### Top Events',
          ...topEvents.map(([name, count]) => `- **${name}**: ${formatNumber(count)}`),
          '',
          '### Anomalies',
          ...(anomalies.length > 0
            ? anomalies.map((a) => `- ${a.timestamp}: ${formatNumber(a.value)} (unusual activity)`)
            : ['- No anomalies detected']),
          '',
          '### Daily Trend',
          ...timeSeries.slice(-7).map((ts) => `- ${ts.timestamp}: ${formatNumber(ts.value)} events`),
          '',
          '### Recommendations',
          '- Monitor the top event categories for engagement patterns',
          '- Set up funnel analysis for key conversion flows',
          '- Configure retention cohorts for user lifecycle tracking',
          ...(anomalies.length > 0 ? ['- Investigate detected anomalies for root cause'] : []),
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_get_insights failed', msg);
        return `Error getting insights: ${msg}`;
      }
    },
  };
}
