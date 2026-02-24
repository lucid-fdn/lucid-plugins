// ---------------------------------------------------------------------------
// metric-calculator.ts -- Metric aggregation and time series computation
// ---------------------------------------------------------------------------

import type { Aggregation, MetricPeriod } from '../types/common.js';
import type { MetricEvent } from '../types/database.js';
import { AnalyticsError } from '../utils/errors.js';

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export function aggregateEvents(events: MetricEvent[], aggregation: Aggregation): number {
  if (events.length === 0) return 0;

  switch (aggregation) {
    case 'count':
      return events.length;
    case 'unique': {
      const userIds = new Set(events.map((e) => e.user_id).filter(Boolean));
      return userIds.size;
    }
    case 'sum': {
      return events.reduce((acc, e) => {
        const val = Number(e.properties?.value ?? 0);
        return acc + (isNaN(val) ? 0 : val);
      }, 0);
    }
    case 'avg': {
      const values = events.map((e) => Number(e.properties?.value ?? 0)).filter((v) => !isNaN(v));
      if (values.length === 0) return 0;
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
    case 'min': {
      const vals = events.map((e) => Number(e.properties?.value ?? Infinity)).filter((v) => !isNaN(v));
      return vals.length > 0 ? Math.min(...vals) : 0;
    }
    case 'max': {
      const vals = events.map((e) => Number(e.properties?.value ?? -Infinity)).filter((v) => !isNaN(v));
      return vals.length > 0 ? Math.max(...vals) : 0;
    }
    case 'p50':
      return computePercentile(
        events.map((e) => Number(e.properties?.value ?? 0)).filter((v) => !isNaN(v)),
        50,
      );
    case 'p90':
      return computePercentile(
        events.map((e) => Number(e.properties?.value ?? 0)).filter((v) => !isNaN(v)),
        90,
      );
    case 'p99':
      return computePercentile(
        events.map((e) => Number(e.properties?.value ?? 0)).filter((v) => !isNaN(v)),
        99,
      );
    default:
      throw new AnalyticsError(`Unknown aggregation: ${aggregation}`);
  }
}

export function computeGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function computePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  if (percentile < 0 || percentile > 100) {
    throw new AnalyticsError(`Percentile must be between 0 and 100, got ${percentile}`);
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return sorted[lower] * (1 - fraction) + sorted[upper] * fraction;
}

export function buildTimeSeries(events: MetricEvent[], period: MetricPeriod): TimeSeriesPoint[] {
  if (events.length === 0) return [];

  const buckets = new Map<string, number>();

  for (const event of events) {
    const date = new Date(event.timestamp);
    const key = getBucketKey(date, period);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([timestamp, value]) => ({ timestamp, value }));
}

function getBucketKey(date: Date, period: MetricPeriod): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');

  switch (period) {
    case 'hour':
      return `${year}-${month}-${day}T${hour}:00:00Z`;
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week': {
      const d = new Date(date);
      d.setUTCDate(d.getUTCDate() - d.getUTCDay());
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
    case 'month':
      return `${year}-${month}`;
    case 'quarter': {
      const q = Math.ceil((date.getUTCMonth() + 1) / 3);
      return `${year}-Q${q}`;
    }
    case 'year':
      return `${year}`;
  }
}
