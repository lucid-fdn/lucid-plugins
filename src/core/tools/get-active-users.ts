// ---------------------------------------------------------------------------
// get-active-users.ts -- DAU/WAU/MAU analysis
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig, ProviderRegistry } from '../types/index.js';
import { queryEvents } from '../db/events.js';
import { computeGrowthRate } from '../analysis/metric-calculator.js';
import { formatNumber, formatPct } from '../utils/text.js';
import { isoDate, daysAgo } from '../utils/date.js';
import { log } from '../utils/logger.js';

interface GetActiveUsersParams {
  period: string;
  start_date?: string;
  end_date?: string;
}

export function createGetActiveUsersTool(deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition<GetActiveUsersParams> {
  return {
    name: 'metrics_get_active_users',
    description:
      'Get active user counts (DAU, WAU, or MAU) with growth rates compared to the previous period.',
    params: {
      period: {
        type: 'enum',
        required: true,
        description: 'Period for active user calculation',
        values: ['day', 'week', 'month'],
      },
      start_date: { type: 'string', required: false, description: 'Start date (ISO format)' },
      end_date: { type: 'string', required: false, description: 'End date (ISO format)' },
    },
    execute: async (params: GetActiveUsersParams): Promise<string> => {
      try {
        const periodDays = params.period === 'day' ? 1 : params.period === 'week' ? 7 : 30;
        const endDate = params.end_date ?? isoDate(new Date());
        const startDate = params.start_date ?? isoDate(daysAgo(periodDays));
        const prevStart = isoDate(new Date(new Date(startDate).getTime() - periodDays * 86400000));

        // Try providers first
        const configured = deps.providerRegistry.getConfigured();
        for (const provider of configured) {
          if (provider.getActiveUsers) {
            try {
              const data = await provider.getActiveUsers({ start: startDate, end: endDate });
              const lines = [
                `## Active Users (${params.period === 'day' ? 'DAU' : params.period === 'week' ? 'WAU' : 'MAU'})`,
                '',
                `- **Source**: ${provider.name}`,
                `- **Count**: ${formatNumber(data.count)}`,
                `- **Previous**: ${formatNumber(data.previous_count)}`,
                `- **Growth**: ${formatPct(data.growth_rate)}`,
                `- **Period**: ${startDate} to ${endDate}`,
              ];
              return lines.join('\n');
            } catch {
              // Fall through
            }
          }
        }

        // Fall back to local DB
        const currentEvents = await queryEvents({
          tenant_id: deps.config.tenantId,
          start_date: startDate,
          end_date: endDate,
        });
        const prevEvents = await queryEvents({
          tenant_id: deps.config.tenantId,
          start_date: prevStart,
          end_date: startDate,
        });

        const currentUsers = new Set(currentEvents.map((e) => e.user_id).filter(Boolean));
        const prevUsers = new Set(prevEvents.map((e) => e.user_id).filter(Boolean));
        const growth = computeGrowthRate(currentUsers.size, prevUsers.size);

        const periodLabel = params.period === 'day' ? 'DAU' : params.period === 'week' ? 'WAU' : 'MAU';

        const lines = [
          `## Active Users (${periodLabel})`,
          '',
          `- **Count**: ${formatNumber(currentUsers.size)}`,
          `- **Previous period**: ${formatNumber(prevUsers.size)}`,
          `- **Growth**: ${formatPct(growth)}`,
          `- **Period**: ${startDate} to ${endDate}`,
          `- **Total events**: ${currentEvents.length}`,
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_get_active_users failed', msg);
        return `Error getting active users: ${msg}`;
      }
    },
  };
}
