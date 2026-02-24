// ---------------------------------------------------------------------------
// retention-analyzer.test.ts -- Tests for retention cohort analysis
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { buildCohortMatrix, computeRetentionCurve, findChurnPoints } from '../../src/core/analysis/retention-analyzer.js';

describe('buildCohortMatrix', () => {
  it('builds retention percentages', () => {
    const sizes = [100, 80, 60];
    const returns = [
      [80, 50, 30],
      [60, 40],
      [45],
    ];
    const matrix = buildCohortMatrix(sizes, returns);
    expect(matrix[0][0]).toBe(80); // 80/100 = 80%
    expect(matrix[0][1]).toBe(50); // 50/100 = 50%
    expect(matrix[1][0]).toBe(75); // 60/80 = 75%
  });

  it('handles zero-size cohorts', () => {
    const matrix = buildCohortMatrix([0], [[10]]);
    expect(matrix[0][0]).toBe(0);
  });

  it('handles empty data', () => {
    const matrix = buildCohortMatrix([], []);
    expect(matrix).toEqual([]);
  });

  it('handles missing return data', () => {
    const matrix = buildCohortMatrix([100, 50], [[], []]);
    expect(matrix[0]).toEqual([]);
    expect(matrix[1]).toEqual([]);
  });
});

describe('computeRetentionCurve', () => {
  it('computes average retention across cohorts', () => {
    const matrix = [
      [80, 60, 40],
      [70, 50, 30],
      [90, 70, 50],
    ];
    const curve = computeRetentionCurve(matrix);
    expect(curve.periods).toEqual([0, 1, 2]);
    expect(curve.rates[0]).toBe(80); // avg of 80, 70, 90
    expect(curve.rates[1]).toBe(60); // avg of 60, 50, 70
    expect(curve.rates[2]).toBe(40); // avg of 40, 30, 50
  });

  it('computes average retention', () => {
    const matrix = [[100, 50]];
    const curve = computeRetentionCurve(matrix);
    expect(curve.average_retention).toBe(75); // avg of 100 and 50
  });

  it('handles empty matrix', () => {
    const curve = computeRetentionCurve([]);
    expect(curve.periods).toEqual([]);
    expect(curve.rates).toEqual([]);
    expect(curve.average_retention).toBe(0);
  });

  it('handles variable-length cohorts', () => {
    const matrix = [
      [100, 80, 60],
      [90, 70],
      [85],
    ];
    const curve = computeRetentionCurve(matrix);
    expect(curve.periods.length).toBe(3);
    // Period 2 only has one cohort contributing
    expect(curve.rates[2]).toBe(60);
  });
});

describe('findChurnPoints', () => {
  it('identifies high churn periods', () => {
    const curve = {
      periods: [0, 1, 2, 3, 4],
      rates: [100, 60, 55, 30, 28],
      average_retention: 54.6,
    };
    const points = findChurnPoints(curve);
    expect(points.length).toBeGreaterThan(0);
    // Should find the biggest churn at period 1 (40% drop)
    expect(points[0].churn_rate).toBe(40);
    expect(points[0].severity).toBe('critical');
  });

  it('classifies severity correctly', () => {
    const curve = {
      periods: [0, 1, 2, 3, 4],
      rates: [100, 95, 80, 72, 65],
      average_retention: 82.4,
    };
    const points = findChurnPoints(curve);
    const severities = points.map((p) => p.severity);
    expect(severities).toContain('medium');
  });

  it('returns empty for flat curve', () => {
    const curve = {
      periods: [0, 1, 2],
      rates: [50, 50, 50],
      average_retention: 50,
    };
    const points = findChurnPoints(curve);
    expect(points).toEqual([]);
  });

  it('sorts by churn rate descending', () => {
    const curve = {
      periods: [0, 1, 2, 3],
      rates: [100, 90, 60, 50],
      average_retention: 75,
    };
    const points = findChurnPoints(curve);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].churn_rate).toBeLessThanOrEqual(points[i - 1].churn_rate);
    }
  });
});
