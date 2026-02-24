// ---------------------------------------------------------------------------
// posthog.ts -- PostHog analytics provider (self-hosted friendly)
// ---------------------------------------------------------------------------

import { BaseProvider } from './base.js';
import type { PluginConfig } from '../types/config.js';
import type { EventQuery, EventQueryResult, MetricDataPoint, FunnelStepData, RetentionData, ActiveUserData, DateRange } from '../types/provider.js';
import type { MetricDefinition, FunnelDefinition, CohortDefinition } from '../types/database.js';
import { log } from '../utils/logger.js';

export class PosthogProvider extends BaseProvider {
  name = 'posthog';
  private apiKey: string | undefined;
  private host: string;

  constructor(config: PluginConfig) {
    super({ maxConcurrent: 3, minTime: 200 });
    this.apiKey = config.posthogApiKey;
    this.host = config.posthogHost ?? 'https://app.posthog.com';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async queryEvents(params: EventQuery): Promise<EventQueryResult> {
    return this.scheduleWithRetry(async () => {
      const url = new URL(`${this.host}/api/event/`);
      if (params.event_name) url.searchParams.set('event', params.event_name);
      if (params.start_date) url.searchParams.set('after', params.start_date);
      if (params.end_date) url.searchParams.set('before', params.end_date);
      if (params.limit) url.searchParams.set('limit', String(params.limit));

      const data = await this.fetchJson<{
        results: Array<{ event: string; distinct_id: string; properties: Record<string, unknown>; timestamp: string }>;
      }>(url.toString(), { headers: this.headers() });

      return {
        events: data.results.map((e) => ({
          event_name: e.event,
          user_id: e.distinct_id ?? null,
          properties: e.properties,
          timestamp: e.timestamp,
        })),
        total: data.results.length,
      };
    });
  }

  async queryMetric(metric: MetricDefinition, period: DateRange): Promise<MetricDataPoint[]> {
    return this.scheduleWithRetry(async () => {
      log.debug(`PostHog queryMetric: ${metric.name}`);
      const data = await this.fetchJson<{
        result: Array<{ data: number[]; days: string[]; label: string }>;
      }>(`${this.host}/api/insight/trend/`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          events: [{ id: metric.event_name, type: 'events', math: metric.aggregation }],
          date_from: period.start,
          date_to: period.end,
        }),
      });

      if (!data.result?.[0]) return [];
      const series = data.result[0];
      return series.days.map((day, i) => ({
        timestamp: day,
        value: series.data[i] ?? 0,
        label: series.label,
      }));
    });
  }

  async queryFunnel(funnel: FunnelDefinition, period: DateRange): Promise<FunnelStepData[]> {
    return this.scheduleWithRetry(async () => {
      const events = funnel.steps.map((s) => ({ id: s.event_name, type: 'events' }));
      const data = await this.fetchJson<{
        result: Array<{ name: string; count: number; conversion_rate: number }>;
      }>(`${this.host}/api/insight/funnel/`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          events,
          date_from: period.start,
          date_to: period.end,
          funnel_window_days: Math.ceil(funnel.conversion_window / 24),
        }),
      });

      return data.result.map((step) => ({
        step_name: step.name,
        count: step.count,
        conversion_rate: step.conversion_rate * 100,
        drop_off_rate: (1 - step.conversion_rate) * 100,
      }));
    });
  }

  async queryRetention(_cohort: CohortDefinition, period: DateRange): Promise<RetentionData> {
    return this.scheduleWithRetry(async () => {
      const data = await this.fetchJson<{
        result: Array<{ date: string; values: Array<{ count: number }> }>;
      }>(`${this.host}/api/insight/retention/`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          date_from: period.start,
          date_to: period.end,
        }),
      });

      const cohorts = data.result.map((row) => {
        const size = row.values[0]?.count ?? 0;
        return {
          cohort_date: row.date,
          size,
          retention: row.values.map((v) => (size > 0 ? (v.count / size) * 100 : 0)),
        };
      });

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
      const data = await this.fetchJson<{
        result: Array<{ data: number[]; days: string[] }>;
      }>(`${this.host}/api/insight/trend/`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          events: [{ id: '$pageview', type: 'events', math: 'dau' }],
          date_from: period.start,
          date_to: period.end,
        }),
      });

      const series = data.result?.[0];
      const count = series?.data?.reduce((a: number, b: number) => a + b, 0) ?? 0;

      return {
        period: `${period.start} to ${period.end}`,
        count,
        previous_count: 0,
        growth_rate: 0,
      };
    });
  }
}
