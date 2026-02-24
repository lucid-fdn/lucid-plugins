// ---------------------------------------------------------------------------
// amplitude.ts -- Amplitude analytics provider
// ---------------------------------------------------------------------------

import { BaseProvider } from './base.js';
import type { PluginConfig } from '../types/config.js';
import type { EventQuery, EventQueryResult, MetricDataPoint, FunnelStepData, RetentionData, DateRange } from '../types/provider.js';
import type { MetricDefinition, FunnelDefinition, CohortDefinition } from '../types/database.js';
import { log } from '../utils/logger.js';

export class AmplitudeProvider extends BaseProvider {
  name = 'amplitude';
  private apiKey: string | undefined;
  private secret: string | undefined;

  constructor(config: PluginConfig) {
    super({ maxConcurrent: 3, minTime: 250 });
    this.apiKey = config.amplitudeApiKey;
    this.secret = config.amplitudeSecret;
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.secret);
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.apiKey}:${this.secret}`).toString('base64')}`;
  }

  async queryEvents(params: EventQuery): Promise<EventQueryResult> {
    return this.scheduleWithRetry(async () => {
      const url = new URL('https://amplitude.com/api/2/events/list');
      if (params.start_date) url.searchParams.set('start', params.start_date);
      if (params.end_date) url.searchParams.set('end', params.end_date);
      if (params.event_name) url.searchParams.set('event_type', params.event_name);

      const data = await this.fetchJson<{
        data: Array<{ event_type: string; user_id: string; event_properties: Record<string, unknown>; event_time: string }>;
      }>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      return {
        events: data.data.map((e) => ({
          event_name: e.event_type,
          user_id: e.user_id ?? null,
          properties: e.event_properties,
          timestamp: e.event_time,
        })),
        total: data.data.length,
      };
    });
  }

  async queryMetric(metric: MetricDefinition, period: DateRange): Promise<MetricDataPoint[]> {
    return this.scheduleWithRetry(async () => {
      log.debug(`Amplitude queryMetric: ${metric.name}`);
      const url = new URL('https://amplitude.com/api/2/events/segmentation');
      url.searchParams.set('e', JSON.stringify({ event_type: metric.event_name }));
      url.searchParams.set('start', period.start);
      url.searchParams.set('end', period.end);

      const data = await this.fetchJson<{
        data: { series: number[][]; xValues: string[] };
      }>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      return data.data.xValues.map((date, i) => ({
        timestamp: date,
        value: data.data.series[0]?.[i] ?? 0,
        label: metric.name,
      }));
    });
  }

  async queryFunnel(funnel: FunnelDefinition, period: DateRange): Promise<FunnelStepData[]> {
    return this.scheduleWithRetry(async () => {
      const events = funnel.steps.map((s) => ({ event_type: s.event_name }));
      const url = new URL('https://amplitude.com/api/2/funnels');
      url.searchParams.set('e', JSON.stringify(events));
      url.searchParams.set('start', period.start);
      url.searchParams.set('end', period.end);

      const data = await this.fetchJson<{
        data: Array<{ stepName: string; count: number; cumulativeConversionRate: number }>;
      }>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      return data.data.map((step, i) => ({
        step_name: step.stepName ?? funnel.steps[i]?.event_name ?? `Step ${i + 1}`,
        count: step.count,
        conversion_rate: step.cumulativeConversionRate * 100,
        drop_off_rate: (1 - step.cumulativeConversionRate) * 100,
      }));
    });
  }

  async queryRetention(_cohort: CohortDefinition, period: DateRange): Promise<RetentionData> {
    return this.scheduleWithRetry(async () => {
      const url = new URL('https://amplitude.com/api/2/retention');
      url.searchParams.set('start', period.start);
      url.searchParams.set('end', period.end);

      const data = await this.fetchJson<{
        data: Array<{ date: string; count: number; retainedCounts: number[] }>;
      }>(url.toString(), {
        headers: { Authorization: this.getAuthHeader() },
      });

      const cohorts = data.data.map((d) => ({
        cohort_date: d.date,
        size: d.count,
        retention: d.retainedCounts.map((r) => (d.count > 0 ? (r / d.count) * 100 : 0)),
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
}
