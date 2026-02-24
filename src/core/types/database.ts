// ---------------------------------------------------------------------------
// database.ts -- Database entity types
// ---------------------------------------------------------------------------

import type { EventType, Aggregation, MetricPeriod, ExperimentStatus, FeatureStatus, ChartType } from './common.js';

export interface MetricEvent {
  id: string;
  tenant_id: string;
  event_name: string;
  event_type: EventType;
  user_id: string | null;
  session_id: string | null;
  properties: Record<string, unknown>;
  timestamp: string;
  created_at: string;
}

export interface MetricDefinition {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  event_name: string;
  aggregation: Aggregation;
  filters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FunnelStep {
  event_name: string;
  filters?: Record<string, unknown>;
}

export interface FunnelDefinition {
  id: string;
  tenant_id: string;
  name: string;
  steps: FunnelStep[];
  conversion_window: number; // hours
  created_at: string;
  updated_at: string;
}

export interface FunnelResult {
  id: string;
  funnel_id: string;
  period_start: string;
  period_end: string;
  step_counts: number[];
  conversion_rates: number[];
  total_entered: number;
  total_converted: number;
  created_at: string;
}

export interface CohortDefinition {
  id: string;
  tenant_id: string;
  name: string;
  entry_event: string;
  return_event: string;
  period: MetricPeriod;
  created_at: string;
  updated_at: string;
}

export interface ExperimentVariant {
  name: string;
  weight: number;
  users: number;
  conversions: number;
  conversion_rate: number;
}

export interface Experiment {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  metric_id: string;
  start_date: string | null;
  end_date: string | null;
  results: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  adoption_metric_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidget {
  id: string;
  tenant_id: string;
  dashboard_name: string;
  widget_type: ChartType;
  config: Record<string, unknown>;
  position: number;
  created_at: string;
}
