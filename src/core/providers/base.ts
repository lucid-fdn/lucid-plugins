// ---------------------------------------------------------------------------
// base.ts -- Abstract base provider with rate limiting
// ---------------------------------------------------------------------------

import Bottleneck from 'bottleneck';
import type { AnalyticsProvider, EventQuery, EventQueryResult, MetricDataPoint, FunnelStepData, RetentionData, ActiveUserData, DateRange } from '../types/provider.js';
import type { MetricDefinition, FunnelDefinition, CohortDefinition } from '../types/database.js';
import { withRetry } from '../utils/retry.js';
import { log } from '../utils/logger.js';
import { FetchError } from '../utils/errors.js';

export abstract class BaseProvider implements AnalyticsProvider {
  abstract name: string;

  protected limiter: Bottleneck;

  constructor(opts?: { maxConcurrent?: number; minTime?: number }) {
    this.limiter = new Bottleneck({
      maxConcurrent: opts?.maxConcurrent ?? 2,
      minTime: opts?.minTime ?? 500,
    });
  }

  abstract isConfigured(): boolean;

  async queryEvents?(params: EventQuery): Promise<EventQueryResult>;
  async queryMetric?(metric: MetricDefinition, period: DateRange): Promise<MetricDataPoint[]>;
  async queryFunnel?(funnel: FunnelDefinition, period: DateRange): Promise<FunnelStepData[]>;
  async queryRetention?(cohort: CohortDefinition, period: DateRange): Promise<RetentionData>;
  async getActiveUsers?(period: DateRange): Promise<ActiveUserData>;

  protected scheduleWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter.schedule(() => withRetry(fn, { maxAttempts: 2, baseDelay: 2000 }));
  }

  protected async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    log.debug(`${this.name} fetch: ${url}`);
    const res = await fetch(url, init);
    if (!res.ok) {
      throw new FetchError(`${this.name} HTTP ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }
}
