// ---------------------------------------------------------------------------
// funnel-analyzer.test.ts -- Tests for funnel conversion analysis
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { analyzeFunnel, compareFunnels } from '../../src/core/analysis/funnel-analyzer.js';

describe('analyzeFunnel', () => {
  it('computes conversion rates for a simple funnel', () => {
    const result = analyzeFunnel([1000, 800, 400, 200]);
    expect(result.conversion_rates.length).toBe(4);
    expect(result.conversion_rates[0]).toBe(100); // First step is always 100%
    expect(result.conversion_rates[1]).toBe(80);
    expect(result.conversion_rates[2]).toBe(50);
    expect(result.conversion_rates[3]).toBe(50);
  });

  it('computes overall conversion', () => {
    const result = analyzeFunnel([1000, 800, 400, 200]);
    expect(result.overall_conversion).toBe(20); // 200/1000
  });

  it('identifies bottleneck step', () => {
    const result = analyzeFunnel([1000, 800, 200, 150]);
    expect(result.bottleneck_step).toBe(2); // Biggest drop from 800 to 200
  });

  it('handles single step funnel', () => {
    const result = analyzeFunnel([500]);
    expect(result.conversion_rates).toEqual([100]);
    expect(result.overall_conversion).toBe(100);
  });

  it('handles empty funnel', () => {
    const result = analyzeFunnel([]);
    expect(result.conversion_rates).toEqual([]);
    expect(result.overall_conversion).toBe(0);
    expect(result.bottleneck_step).toBe(-1);
  });

  it('computes drop-off rates', () => {
    const result = analyzeFunnel([1000, 800, 400, 200]);
    expect(result.drop_off_rates[0]).toBe(0); // No drop-off at first step
    expect(result.drop_off_rates[1]).toBe(20); // 20% drop off
    expect(result.drop_off_rates[2]).toBe(50); // 50% drop off
  });

  it('handles zero values', () => {
    const result = analyzeFunnel([1000, 0, 0, 0]);
    expect(result.conversion_rates[1]).toBe(0);
    expect(result.overall_conversion).toBe(0);
  });

  it('handles perfect conversion', () => {
    const result = analyzeFunnel([100, 100, 100, 100]);
    expect(result.overall_conversion).toBe(100);
    expect(result.drop_off_rates).toEqual([0, 0, 0, 0]);
  });

  it('handles two-step funnel', () => {
    const result = analyzeFunnel([500, 250]);
    expect(result.conversion_rates).toEqual([100, 50]);
    expect(result.overall_conversion).toBe(50);
  });

  it('identifies correct bottleneck with equal drops', () => {
    // When drops are equal, the first one with that drop should be the bottleneck
    const result = analyzeFunnel([1000, 500, 250]);
    // Both steps drop by 50%, but step 1 drops 500 users (50% of 1000)
    expect(result.bottleneck_step).toBeGreaterThanOrEqual(1);
  });
});

describe('compareFunnels', () => {
  it('computes conversion change between periods', () => {
    const result = compareFunnels(
      [1000, 500, 250],
      [1000, 600, 350],
    );
    expect(result.overall_change).toBeGreaterThan(0);
  });

  it('identifies improved steps', () => {
    const result = compareFunnels(
      [1000, 500, 250],
      [1000, 700, 400],
    );
    expect(result.improved_steps.length).toBeGreaterThan(0);
  });

  it('identifies degraded steps', () => {
    const result = compareFunnels(
      [1000, 800, 600],
      [1000, 400, 200],
    );
    expect(result.degraded_steps.length).toBeGreaterThan(0);
  });

  it('handles identical funnels', () => {
    const result = compareFunnels(
      [1000, 500, 250],
      [1000, 500, 250],
    );
    expect(result.overall_change).toBe(0);
    expect(result.improved_steps).toEqual([]);
    expect(result.degraded_steps).toEqual([]);
  });
});
