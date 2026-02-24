// ---------------------------------------------------------------------------
// get-feature-adoption.ts -- Feature adoption rate analysis
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { getFeatureByName } from '../db/features.js';
import { queryEvents, getUniqueUsers } from '../db/events.js';
import { METRIC_PERIODS } from '../types/common.js';
import { formatNumber, formatPct } from '../utils/text.js';
import { isoDate, daysAgo } from '../utils/date.js';
import { log } from '../utils/logger.js';

interface GetFeatureAdoptionParams {
  feature_name: string;
  period?: string;
}

export function createGetFeatureAdoptionTool(deps: { config: PluginConfig }): ToolDefinition<GetFeatureAdoptionParams> {
  return {
    name: 'metrics_get_feature_adoption',
    description:
      'Get feature adoption metrics including adoption rate, unique users, and time-to-adopt analysis for a specific feature.',
    params: {
      feature_name: { type: 'string', required: true, description: 'Name of the feature to analyze' },
      period: {
        type: 'enum',
        required: false,
        description: 'Analysis period',
        values: [...METRIC_PERIODS],
        default: 'month',
      },
    },
    execute: async (params: GetFeatureAdoptionParams): Promise<string> => {
      try {
        const feature = await getFeatureByName(deps.config.tenantId, params.feature_name);
        const periodDays = getPeriodDays(params.period ?? 'month');
        const startDate = isoDate(daysAgo(periodDays));
        const endDate = isoDate(new Date());

        // Get events related to the feature (using feature name as event name pattern)
        const featureEvents = await queryEvents({
          tenant_id: deps.config.tenantId,
          event_name: params.feature_name,
          start_date: startDate,
          end_date: endDate,
        });

        // Get total unique users in the period
        const totalUsers = await getUniqueUsers(deps.config.tenantId, startDate, endDate);
        const featureUsers = new Set(featureEvents.map((e) => e.user_id).filter(Boolean));
        const adoptionRate = totalUsers > 0 ? (featureUsers.size / totalUsers) * 100 : 0;

        // Calculate average time-to-adopt (time from first seen to feature use)
        const firstUseByUser = new Map<string, number>();
        for (const event of featureEvents) {
          if (!event.user_id) continue;
          const ts = new Date(event.timestamp).getTime();
          const existing = firstUseByUser.get(event.user_id);
          if (!existing || ts < existing) {
            firstUseByUser.set(event.user_id, ts);
          }
        }

        // Previous period for comparison
        const prevStart = isoDate(daysAgo(periodDays * 2));
        const prevEvents = await queryEvents({
          tenant_id: deps.config.tenantId,
          event_name: params.feature_name,
          start_date: prevStart,
          end_date: startDate,
        });
        const prevFeatureUsers = new Set(prevEvents.map((e) => e.user_id).filter(Boolean));
        const prevTotalUsers = await getUniqueUsers(deps.config.tenantId, prevStart, startDate);
        const prevAdoptionRate = prevTotalUsers > 0 ? (prevFeatureUsers.size / prevTotalUsers) * 100 : 0;
        const adoptionChange = adoptionRate - prevAdoptionRate;

        const lines = [
          `## Feature Adoption: ${params.feature_name}`,
          '',
          `- **Status**: ${feature?.status ?? 'unknown'}`,
          `- **Period**: ${startDate} to ${endDate}`,
          `- **Adoption rate**: ${formatPct(adoptionRate)}`,
          `- **Feature users**: ${formatNumber(featureUsers.size)}`,
          `- **Total users**: ${formatNumber(totalUsers)}`,
          `- **Total feature events**: ${featureEvents.length}`,
          '',
          '### Trend',
          `- **Previous period adoption**: ${formatPct(prevAdoptionRate)}`,
          `- **Change**: ${adoptionChange >= 0 ? '+' : ''}${formatPct(adoptionChange)}`,
          `- **Previous period users**: ${formatNumber(prevFeatureUsers.size)}`,
        ];

        if (feature?.description) {
          lines.push('', `**Description**: ${feature.description}`);
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_get_feature_adoption failed', msg);
        return `Error getting feature adoption: ${msg}`;
      }
    },
  };
}

function getPeriodDays(period: string): number {
  switch (period) {
    case 'hour':
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
      return 30;
  }
}
