// ---------------------------------------------------------------------------
// common.ts -- Shared type constants
// ---------------------------------------------------------------------------

export const EVENT_TYPES = ['page_view', 'click', 'form_submit', 'purchase', 'signup', 'custom'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const METRIC_PERIODS = ['hour', 'day', 'week', 'month', 'quarter', 'year'] as const;
export type MetricPeriod = (typeof METRIC_PERIODS)[number];

export const AGGREGATIONS = ['count', 'sum', 'avg', 'min', 'max', 'unique', 'p50', 'p90', 'p99'] as const;
export type Aggregation = (typeof AGGREGATIONS)[number];

export const CHART_TYPES = ['line', 'bar', 'pie', 'funnel', 'cohort', 'heatmap'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export const EXPERIMENT_STATUSES = ['draft', 'running', 'paused', 'completed', 'archived'] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const FEATURE_STATUSES = ['planned', 'in_development', 'beta', 'ga', 'deprecated'] as const;
export type FeatureStatus = (typeof FEATURE_STATUSES)[number];
