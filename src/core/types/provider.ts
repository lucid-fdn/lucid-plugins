// ---------------------------------------------------------------------------
// provider.ts -- Analytics provider interfaces
// ---------------------------------------------------------------------------

import type { MetricDefinition, FunnelDefinition, CohortDefinition } from './database.js';

export interface DateRange {
  start: string;
  end: string;
}

export interface EventQuery {
  event_name?: string;
  event_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface EventQueryResult {
  events: Array<{
    event_name: string;
    user_id: string | null;
    properties: Record<string, unknown>;
    timestamp: string;
  }>;
  total: number;
}

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface FunnelStepData {
  step_name: string;
  count: number;
  conversion_rate: number;
  drop_off_rate: number;
}

export interface RetentionData {
  cohorts: RetentionCohort[];
  overall_retention: number[];
}

export interface RetentionCohort {
  cohort_date: string;
  size: number;
  retention: number[];
}

export interface ActiveUserData {
  period: string;
  count: number;
  previous_count: number;
  growth_rate: number;
}

export interface AnalyticsProvider {
  name: string;
  isConfigured(): boolean;
  queryEvents?(params: EventQuery): Promise<EventQueryResult>;
  queryMetric?(metric: MetricDefinition, period: DateRange): Promise<MetricDataPoint[]>;
  queryFunnel?(funnel: FunnelDefinition, period: DateRange): Promise<FunnelStepData[]>;
  queryRetention?(cohort: CohortDefinition, period: DateRange): Promise<RetentionData>;
  getActiveUsers?(period: DateRange): Promise<ActiveUserData>;
}

export interface ProviderRegistry {
  providers: AnalyticsProvider[];
  getConfigured(): AnalyticsProvider[];
}
