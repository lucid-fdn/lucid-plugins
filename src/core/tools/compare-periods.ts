// ---------------------------------------------------------------------------
// compare-periods.ts -- Period-over-period metric comparison
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { getMetricByName } from '../db/metrics.js';
import { queryEvents } from '../db/events.js';
import { aggregateEvents, computeGrowthRate } from '../analysis/metric-calculator.js';
import { formatNumber, formatPct } from '../utils/text.js';
import { log } from '../utils/logger.js';

interface ComparePeriodsParams {
  metric_name: string;
  period_a_start: string;
  period_a_end: string;
  period_b_start: string;
  period_b_end: string;
}

export function createComparePeriodsTool(deps: { config: PluginConfig }): ToolDefinition<ComparePeriodsParams> {
  return {
    name: 'metrics_compare_periods',
    description:
      'Compare a metric across two time periods. Shows values, growth rates, and highlights changes between period A and period B.',
    params: {
      metric_name: { type: 'string', required: true, description: 'Name of the metric to compare' },
      period_a_start: { type: 'string', required: true, description: 'Period A start date (ISO format)' },
      period_a_end: { type: 'string', required: true, description: 'Period A end date (ISO format)' },
      period_b_start: { type: 'string', required: true, description: 'Period B start date (ISO format)' },
      period_b_end: { type: 'string', required: true, description: 'Period B end date (ISO format)' },
    },
    execute: async (params: ComparePeriodsParams): Promise<string> => {
      try {
        const metric = await getMetricByName(deps.config.tenantId, params.metric_name);
        const eventName = metric?.event_name ?? params.metric_name;
        const aggregation = metric?.aggregation ?? 'count';

        const [eventsA, eventsB] = await Promise.all([
          queryEvents({
            tenant_id: deps.config.tenantId,
            event_name: eventName,
            start_date: params.period_a_start,
            end_date: params.period_a_end,
          }),
          queryEvents({
            tenant_id: deps.config.tenantId,
            event_name: eventName,
            start_date: params.period_b_start,
            end_date: params.period_b_end,
          }),
        ]);

        const valueA = aggregateEvents(eventsA, aggregation);
        const valueB = aggregateEvents(eventsB, aggregation);
        const growth = computeGrowthRate(valueB, valueA);

        const uniqueUsersA = new Set(eventsA.map((e) => e.user_id).filter(Boolean)).size;
        const uniqueUsersB = new Set(eventsB.map((e) => e.user_id).filter(Boolean)).size;
        const userGrowth = computeGrowthRate(uniqueUsersB, uniqueUsersA);

        const direction = growth > 0 ? 'increased' : growth < 0 ? 'decreased' : 'unchanged';

        const lines = [
          `## Period Comparison: ${params.metric_name}`,
          '',
          `### Period A: ${params.period_a_start} to ${params.period_a_end}`,
          `- **Value**: ${formatNumber(valueA)} (${aggregation})`,
          `- **Events**: ${eventsA.length}`,
          `- **Unique users**: ${uniqueUsersA}`,
          '',
          `### Period B: ${params.period_b_start} to ${params.period_b_end}`,
          `- **Value**: ${formatNumber(valueB)} (${aggregation})`,
          `- **Events**: ${eventsB.length}`,
          `- **Unique users**: ${uniqueUsersB}`,
          '',
          '### Change',
          `- **Value change**: ${formatPct(growth)} (${direction})`,
          `- **User change**: ${formatPct(userGrowth)}`,
          `- **Absolute difference**: ${formatNumber(Math.abs(valueB - valueA))}`,
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_compare_periods failed', msg);
        return `Error comparing periods: ${msg}`;
      }
    },
  };
}
