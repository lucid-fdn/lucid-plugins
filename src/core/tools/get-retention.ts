// ---------------------------------------------------------------------------
// get-retention.ts -- Retention cohort analysis
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig, ProviderRegistry } from '../types/index.js';
import { queryEvents } from '../db/events.js';
import { buildCohortMatrix, computeRetentionCurve, findChurnPoints } from '../analysis/retention-analyzer.js';
import { buildRetentionInsightPrompt } from '../analysis/prompts.js';
import { METRIC_PERIODS } from '../types/common.js';
import { formatPct } from '../utils/text.js';
import { isoDate, daysAgo } from '../utils/date.js';
import { log } from '../utils/logger.js';

interface GetRetentionParams {
  entry_event: string;
  return_event?: string;
  period?: string;
  cohort_count?: number;
}

export function createGetRetentionTool(deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition<GetRetentionParams> {
  return {
    name: 'metrics_get_retention',
    description:
      'Get retention cohort analysis. Shows how well users are retained over time after a specific entry event, with churn point identification.',
    params: {
      entry_event: { type: 'string', required: true, description: 'The event that defines cohort entry (e.g. "signup")' },
      return_event: {
        type: 'string',
        required: false,
        description: 'The event that defines a return (defaults to any event)',
      },
      period: {
        type: 'enum',
        required: false,
        description: 'Cohort period granularity',
        values: [...METRIC_PERIODS],
        default: 'week',
      },
      cohort_count: {
        type: 'number',
        required: false,
        description: 'Number of cohorts to analyze (default 8)',
        default: 8,
        min: 1,
        max: 52,
      },
    },
    execute: async (params: GetRetentionParams): Promise<string> => {
      try {
        const cohortCount = params.cohort_count ?? 8;
        const periodDays = getPeriodDays(params.period ?? 'week');
        const totalDays = cohortCount * periodDays;
        const startDate = isoDate(daysAgo(totalDays));
        const endDate = isoDate(new Date());

        // Get entry events
        const entryEvents = await queryEvents({
          tenant_id: deps.config.tenantId,
          event_name: params.entry_event,
          start_date: startDate,
          end_date: endDate,
        });

        // Get return events
        const returnEvents = await queryEvents({
          tenant_id: deps.config.tenantId,
          event_name: params.return_event,
          start_date: startDate,
          end_date: endDate,
        });

        // Build cohorts
        const cohortSizes: number[] = [];
        const returnCounts: number[][] = [];

        for (let i = 0; i < cohortCount; i++) {
          const cohortStart = new Date(new Date().getTime() - (totalDays - i * periodDays) * 86400000);
          const cohortEnd = new Date(cohortStart.getTime() + periodDays * 86400000);

          const cohortUsers = new Set(
            entryEvents
              .filter((e) => {
                const t = new Date(e.timestamp).getTime();
                return t >= cohortStart.getTime() && t < cohortEnd.getTime();
              })
              .map((e) => e.user_id)
              .filter(Boolean),
          );

          cohortSizes.push(cohortUsers.size);

          const returns: number[] = [];
          for (let p = 0; p < cohortCount - i; p++) {
            const periodStart = new Date(cohortEnd.getTime() + p * periodDays * 86400000);
            const periodEnd = new Date(periodStart.getTime() + periodDays * 86400000);

            const returning = new Set(
              returnEvents
                .filter((e) => {
                  const t = new Date(e.timestamp).getTime();
                  return t >= periodStart.getTime() && t < periodEnd.getTime() && cohortUsers.has(e.user_id ?? '');
                })
                .map((e) => e.user_id),
            );
            returns.push(returning.size);
          }
          returnCounts.push(returns);
        }

        const matrix = buildCohortMatrix(cohortSizes, returnCounts);
        const curve = computeRetentionCurve(matrix);
        const churnPoints = findChurnPoints(curve);

        const lines = [
          `## Retention Analysis: ${params.entry_event}`,
          '',
          `- **Return event**: ${params.return_event ?? 'any'}`,
          `- **Period**: ${params.period ?? 'week'}`,
          `- **Cohorts**: ${cohortCount}`,
          `- **Average retention**: ${formatPct(curve.average_retention)}`,
          '',
          '### Retention Curve',
          ...curve.rates.map((rate, i) => `- Period ${i}: ${formatPct(rate)}`),
          '',
          '### Key Churn Points',
          ...(churnPoints.length > 0
            ? churnPoints.map((cp) => `- Period ${cp.period}: ${formatPct(cp.churn_rate)} churn (${cp.severity})`)
            : ['- No significant churn points detected']),
          '',
          '### AI Insight Prompt',
          buildRetentionInsightPrompt(
            curve.rates,
            churnPoints.map((cp) => ({ period: cp.period, rate: cp.churn_rate })),
          ),
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_get_retention failed', msg);
        return `Error computing retention: ${msg}`;
      }
    },
  };
}

function getPeriodDays(period: string): number {
  switch (period) {
    case 'hour':
      return 1;
    case 'day':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30;
    case 'quarter':
      return 90;
    case 'year':
      return 365;
    default:
      return 7;
  }
}
