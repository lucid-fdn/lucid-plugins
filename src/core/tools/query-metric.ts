// ---------------------------------------------------------------------------
// query-metric.ts -- Query a defined metric with time series
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig, ProviderRegistry } from '../types/index.js';
import { getMetricByName } from '../db/metrics.js';
import { queryEvents } from '../db/events.js';
import { aggregateEvents, buildTimeSeries, computeGrowthRate } from '../analysis/metric-calculator.js';
import { METRIC_PERIODS, AGGREGATIONS } from '../types/common.js';
import { isoDate, daysAgo } from '../utils/date.js';
import { formatNumber, formatPct } from '../utils/text.js';
import { log } from '../utils/logger.js';

interface QueryMetricParams {
  metric_name: string;
  period?: string;
  start_date?: string;
  end_date?: string;
  aggregation?: string;
}

export function createQueryMetricTool(deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition<QueryMetricParams> {
  return {
    name: 'metrics_query_metric',
    description:
      'Query a product metric by name. Returns time series data, aggregated value, and growth rate. Queries configured analytics providers or local database.',
    params: {
      metric_name: { type: 'string', required: true, description: 'Name of the metric to query' },
      period: {
        type: 'enum',
        required: false,
        description: 'Time period granularity for the time series',
        values: [...METRIC_PERIODS],
        default: 'day',
      },
      start_date: { type: 'string', required: false, description: 'Start date (ISO format, e.g. 2024-01-01)' },
      end_date: { type: 'string', required: false, description: 'End date (ISO format)' },
      aggregation: {
        type: 'enum',
        required: false,
        description: 'Aggregation type override',
        values: [...AGGREGATIONS],
      },
    },
    execute: async (params: QueryMetricParams): Promise<string> => {
      try {
        const metric = await getMetricByName(deps.config.tenantId, params.metric_name);
        const startDate = params.start_date ?? isoDate(daysAgo(30));
        const endDate = params.end_date ?? isoDate(new Date());
        const period = (params.period as (typeof METRIC_PERIODS)[number]) ?? 'day';
        const aggregation =
          (params.aggregation as (typeof AGGREGATIONS)[number]) ?? metric?.aggregation ?? 'count';

        // Try providers first
        const configured = deps.providerRegistry.getConfigured();
        if (metric && configured.length > 0) {
          for (const provider of configured) {
            if (provider.queryMetric) {
              try {
                const dataPoints = await provider.queryMetric(metric, { start: startDate, end: endDate });
                if (dataPoints.length > 0) {
                  const lines = [
                    `## Metric: ${params.metric_name}`,
                    `- **Source**: ${provider.name}`,
                    `- **Period**: ${startDate} to ${endDate}`,
                    `- **Data points**: ${dataPoints.length}`,
                    '',
                    '### Time Series',
                    ...dataPoints.map((dp) => `- ${dp.timestamp}: ${formatNumber(dp.value)}`),
                  ];
                  return lines.join('\n');
                }
              } catch {
                // Fall through to local DB
              }
            }
          }
        }

        // Fall back to local DB
        const eventName = metric?.event_name ?? params.metric_name;
        const events = await queryEvents({
          tenant_id: deps.config.tenantId,
          event_name: eventName,
          start_date: startDate,
          end_date: endDate,
        });

        const value = aggregateEvents(events, aggregation);
        const timeSeries = buildTimeSeries(events, period);

        // Get previous period for growth rate
        const durationMs = new Date(endDate).getTime() - new Date(startDate).getTime();
        const prevStart = isoDate(new Date(new Date(startDate).getTime() - durationMs));
        const prevEvents = await queryEvents({
          tenant_id: deps.config.tenantId,
          event_name: eventName,
          start_date: prevStart,
          end_date: startDate,
        });
        const prevValue = aggregateEvents(prevEvents, aggregation);
        const growth = computeGrowthRate(value, prevValue);

        const lines = [
          `## Metric: ${params.metric_name}`,
          '',
          `- **Value**: ${formatNumber(value)}`,
          `- **Aggregation**: ${aggregation}`,
          `- **Period**: ${startDate} to ${endDate}`,
          `- **Growth**: ${formatPct(growth)}`,
          `- **Previous period value**: ${formatNumber(prevValue)}`,
          `- **Events analyzed**: ${events.length}`,
          '',
          '### Time Series',
          ...timeSeries.map((ts) => `- ${ts.timestamp}: ${formatNumber(ts.value)}`),
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_query_metric failed', msg);
        return `Error querying metric: ${msg}`;
      }
    },
  };
}
