// ---------------------------------------------------------------------------
// mixpanel.ts -- Mixpanel analytics provider
// ---------------------------------------------------------------------------

import { BaseProvider } from './base.js';
import type { PluginConfig } from '../types/config.js';
import type { EventQuery, EventQueryResult, MetricDataPoint, FunnelStepData, RetentionData, ActiveUserData, DateRange } from '../types/provider.js';
import type { MetricDefinition, FunnelDefinition, CohortDefinition } from '../types/database.js';
import { log } from '../utils/logger.js';

export class MixpanelProvider extends BaseProvider {
  name = 'mixpanel';
  private apiKey: string | undefined;
  private secret: string | undefined;

  constructor(config: PluginConfig) {
    super({ maxConcurrent: 3, minTime: 200 });
    this.apiKey = config.mixpanelApiKey;
    this.secret = config.mixpanelSecret;
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.secret);
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.apiKey}:${this.secret}`).toString('base64')}`;
  }

  async queryEvents(params: EventQuery): Promise<EventQueryResult> {
    return this.scheduleWithRetry(async () => {
      const url = new URL('https://data.mixpanel.com/api/2.0/export');
      if (params.start_date) url.searchParams.set('from_date', params.start_date);
      if (params.end_date) url.searchParams.set('to_date', params.end_date);
      if (params.event_name) url.searchParams.set('event', JSON.stringify([params.event_name]));
      if (params.limit) url.searchParams.set('limit', String(params.limit));

      const data = await this.fetchJson<Array<{ event: string; properties: Record<string, unknown> }>>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      return {
        events: data.map((e) => ({
          event_name: e.event,
          user_id: (e.properties.distinct_id as string) ?? null,
          properties: e.properties,
          timestamp: (e.properties.time as string) ?? new Date().toISOString(),
        })),
        total: data.length,
      };
    });
  }

  async queryMetric(metric: MetricDefinition, period: DateRange): Promise<MetricDataPoint[]> {
    return this.scheduleWithRetry(async () => {
      const url = new URL('https://mixpanel.com/api/2.0/insights');
      url.searchParams.set('from_date', period.start);
      url.searchParams.set('to_date', period.end);

      const data = await this.fetchJson<{ series: Record<string, Record<string, number>> }>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      const points: MetricDataPoint[] = [];
      const seriesKey = Object.keys(data.series)[0];
      if (seriesKey) {
        for (const [date, value] of Object.entries(data.series[seriesKey])) {
          points.push({ timestamp: date, value, label: metric.name });
        }
      }
      return points;
    });
  }

  async queryFunnel(funnel: FunnelDefinition, period: DateRange): Promise<FunnelStepData[]> {
    return this.scheduleWithRetry(async () => {
      const url = new URL('https://mixpanel.com/api/2.0/funnels');
      url.searchParams.set('from_date', period.start);
      url.searchParams.set('to_date', period.end);
      url.searchParams.set('funnel_id', funnel.id);

      const data = await this.fetchJson<{
        data: Record<string, { steps: Array<{ count: number; step_conv_ratio: number }> }>;
      }>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      const dateKey = Object.keys(data.data)[0];
      if (!dateKey) return [];

      return data.data[dateKey].steps.map((step, i) => ({
        step_name: funnel.steps[i]?.event_name ?? `Step ${i + 1}`,
        count: step.count,
        conversion_rate: step.step_conv_ratio * 100,
        drop_off_rate: (1 - step.step_conv_ratio) * 100,
      }));
    });
  }

  async queryRetention(_cohort: CohortDefinition, period: DateRange): Promise<RetentionData> {
    return this.scheduleWithRetry(async () => {
      const url = new URL('https://mixpanel.com/api/2.0/retention');
      url.searchParams.set('from_date', period.start);
      url.searchParams.set('to_date', period.end);

      const data = await this.fetchJson<{
        results: Record<string, { counts: number[]; first: number }>;
      }>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      const cohorts = Object.entries(data.results).map(([date, cohort]) => ({
        cohort_date: date,
        size: cohort.first,
        retention: cohort.counts.map((c) => (cohort.first > 0 ? (c / cohort.first) * 100 : 0)),
      }));

      const maxLen = Math.max(...cohorts.map((c) => c.retention.length), 0);
      const overall: number[] = [];
      for (let i = 0; i < maxLen; i++) {
        const vals = cohorts.filter((c) => c.retention.length > i).map((c) => c.retention[i]);
        overall.push(vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
      }

      return { cohorts, overall_retention: overall };
    });
  }

  async getActiveUsers(period: DateRange): Promise<ActiveUserData> {
    return this.scheduleWithRetry(async () => {
      log.debug(`Mixpanel getActiveUsers: ${period.start} to ${period.end}`);
      const url = new URL('https://mixpanel.com/api/2.0/engage');
      url.searchParams.set('from_date', period.start);
      url.searchParams.set('to_date', period.end);

      const data = await this.fetchJson<{ total: number }>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      return {
        period: `${period.start} to ${period.end}`,
        count: data.total,
        previous_count: 0,
        growth_rate: 0,
      };
    });
  }
}
