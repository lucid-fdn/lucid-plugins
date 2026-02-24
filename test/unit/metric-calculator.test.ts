// ---------------------------------------------------------------------------
// metric-calculator.test.ts -- Tests for metric aggregation and time series
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { aggregateEvents, computeGrowthRate, computePercentile, buildTimeSeries } from '../../src/core/analysis/metric-calculator.js';
import { mockEvents, mockEvent } from '../helpers/fixtures.js';

describe('aggregateEvents', () => {
  it('counts events', () => {
    const events = mockEvents(10);
    expect(aggregateEvents(events, 'count')).toBe(10);
  });

  it('counts unique users', () => {
    const events = mockEvents(30);
    expect(aggregateEvents(events, 'unique')).toBe(10);
  });

  it('sums values', () => {
    const events = [
      mockEvent({ properties: { value: 10 } }),
      mockEvent({ properties: { value: 20 } }),
      mockEvent({ properties: { value: 30 } }),
    ];
    expect(aggregateEvents(events, 'sum')).toBe(60);
  });

  it('averages values', () => {
    const events = [
      mockEvent({ properties: { value: 10 } }),
      mockEvent({ properties: { value: 20 } }),
      mockEvent({ properties: { value: 30 } }),
    ];
    expect(aggregateEvents(events, 'avg')).toBe(20);
  });

  it('finds min value', () => {
    const events = [
      mockEvent({ properties: { value: 10 } }),
      mockEvent({ properties: { value: 5 } }),
      mockEvent({ properties: { value: 20 } }),
    ];
    expect(aggregateEvents(events, 'min')).toBe(5);
  });

  it('finds max value', () => {
    const events = [
      mockEvent({ properties: { value: 10 } }),
      mockEvent({ properties: { value: 5 } }),
      mockEvent({ properties: { value: 20 } }),
    ];
    expect(aggregateEvents(events, 'max')).toBe(20);
  });

  it('returns 0 for empty events', () => {
    expect(aggregateEvents([], 'count')).toBe(0);
    expect(aggregateEvents([], 'sum')).toBe(0);
    expect(aggregateEvents([], 'avg')).toBe(0);
  });

  it('handles p50 aggregation', () => {
    const events = [
      mockEvent({ properties: { value: 1 } }),
      mockEvent({ properties: { value: 2 } }),
      mockEvent({ properties: { value: 3 } }),
      mockEvent({ properties: { value: 4 } }),
      mockEvent({ properties: { value: 5 } }),
    ];
    expect(aggregateEvents(events, 'p50')).toBe(3);
  });

  it('handles p90 aggregation', () => {
    const events = Array.from({ length: 100 }, (_, i) =>
      mockEvent({ properties: { value: i + 1 } }),
    );
    const result = aggregateEvents(events, 'p90');
    expect(result).toBeGreaterThan(89);
    expect(result).toBeLessThanOrEqual(91);
  });

  it('handles p99 aggregation', () => {
    const events = Array.from({ length: 100 }, (_, i) =>
      mockEvent({ properties: { value: i + 1 } }),
    );
    const result = aggregateEvents(events, 'p99');
    expect(result).toBeGreaterThan(98);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('throws for unknown aggregation', () => {
    expect(() => aggregateEvents([mockEvent()], 'invalid' as any)).toThrow('Unknown aggregation');
  });
});

describe('computeGrowthRate', () => {
  it('computes positive growth', () => {
    expect(computeGrowthRate(150, 100)).toBe(50);
  });

  it('computes negative growth', () => {
    expect(computeGrowthRate(50, 100)).toBe(-50);
  });

  it('returns 100 for growth from zero', () => {
    expect(computeGrowthRate(50, 0)).toBe(100);
  });

  it('returns 0 for zero to zero', () => {
    expect(computeGrowthRate(0, 0)).toBe(0);
  });
});

describe('computePercentile', () => {
  it('computes 50th percentile (median)', () => {
    expect(computePercentile([1, 2, 3, 4, 5], 50)).toBe(3);
  });

  it('computes 0th percentile', () => {
    expect(computePercentile([1, 2, 3, 4, 5], 0)).toBe(1);
  });

  it('computes 100th percentile', () => {
    expect(computePercentile([1, 2, 3, 4, 5], 100)).toBe(5);
  });

  it('returns 0 for empty array', () => {
    expect(computePercentile([], 50)).toBe(0);
  });

  it('throws for invalid percentile', () => {
    expect(() => computePercentile([1], 101)).toThrow();
    expect(() => computePercentile([1], -1)).toThrow();
  });

  it('interpolates between values', () => {
    const result = computePercentile([1, 2, 3, 4], 25);
    expect(result).toBe(1.75);
  });
});

describe('buildTimeSeries', () => {
  it('groups events by day', () => {
    const events = mockEvents(10);
    const series = buildTimeSeries(events, 'day');
    expect(series.length).toBeGreaterThan(0);
    for (const point of series) {
      expect(point.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(point.value).toBeGreaterThan(0);
    }
  });

  it('groups events by month', () => {
    const events = mockEvents(10);
    const series = buildTimeSeries(events, 'month');
    expect(series.length).toBeGreaterThan(0);
    for (const point of series) {
      expect(point.timestamp).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it('returns empty for no events', () => {
    expect(buildTimeSeries([], 'day')).toEqual([]);
  });

  it('sorts by timestamp', () => {
    const events = mockEvents(20);
    const series = buildTimeSeries(events, 'day');
    for (let i = 1; i < series.length; i++) {
      expect(series[i].timestamp >= series[i - 1].timestamp).toBe(true);
    }
  });
});
