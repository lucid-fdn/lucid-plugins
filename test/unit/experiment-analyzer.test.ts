// ---------------------------------------------------------------------------
// experiment-analyzer.test.ts -- Tests for A/B test statistical analysis
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { analyzeExperiment, computeStatisticalSignificance } from '../../src/core/analysis/experiment-analyzer.js';
import { mockExperimentVariants } from '../helpers/fixtures.js';

describe('analyzeExperiment', () => {
  it('identifies a winner when significant', () => {
    const variants = [
      { name: 'control', weight: 0.5, users: 5000, conversions: 250, conversion_rate: 5.0 },
      { name: 'variant_a', weight: 0.5, users: 5000, conversions: 350, conversion_rate: 7.0 },
    ];
    const result = analyzeExperiment(variants);
    expect(result.winner).toBe('variant_a');
    expect(result.confidence).toBeGreaterThan(90);
    expect(result.lift).toBeGreaterThan(0);
  });

  it('returns no winner when not significant', () => {
    const variants = [
      { name: 'control', weight: 0.5, users: 20, conversions: 2, conversion_rate: 10.0 },
      { name: 'variant_a', weight: 0.5, users: 20, conversions: 3, conversion_rate: 15.0 },
    ];
    const result = analyzeExperiment(variants);
    expect(result.winner).toBeNull();
  });

  it('reports sample size inadequacy', () => {
    const variants = [
      { name: 'control', weight: 0.5, users: 50, conversions: 5, conversion_rate: 10.0 },
      { name: 'variant_a', weight: 0.5, users: 50, conversions: 7, conversion_rate: 14.0 },
    ];
    const result = analyzeExperiment(variants);
    expect(result.sample_size_adequate).toBe(false);
  });

  it('reports adequate sample size', () => {
    const variants = mockExperimentVariants();
    const result = analyzeExperiment(variants);
    expect(result.sample_size_adequate).toBe(true);
  });

  it('handles single variant', () => {
    const result = analyzeExperiment([
      { name: 'control', weight: 1.0, users: 1000, conversions: 50, conversion_rate: 5.0 },
    ]);
    expect(result.winner).toBeNull();
    expect(result.confidence).toBe(0);
  });

  it('computes lift correctly', () => {
    const variants = [
      { name: 'control', weight: 0.5, users: 5000, conversions: 250, conversion_rate: 5.0 },
      { name: 'variant_a', weight: 0.5, users: 5000, conversions: 350, conversion_rate: 7.0 },
    ];
    const result = analyzeExperiment(variants);
    expect(result.lift).toBe(40); // (7-5)/5 * 100 = 40%
  });

  it('returns all variant results', () => {
    const variants = mockExperimentVariants();
    const result = analyzeExperiment(variants);
    expect(result.variants.length).toBe(2);
    expect(result.variants[0].name).toBe('control');
    expect(result.variants[1].name).toBe('variant_a');
  });

  it('handles multiple variants', () => {
    const variants = [
      { name: 'control', weight: 0.33, users: 3000, conversions: 150, conversion_rate: 5.0 },
      { name: 'variant_a', weight: 0.33, users: 3000, conversions: 210, conversion_rate: 7.0 },
      { name: 'variant_b', weight: 0.34, users: 3000, conversions: 240, conversion_rate: 8.0 },
    ];
    const result = analyzeExperiment(variants);
    expect(result.variants.length).toBe(3);
    // variant_b should be the winner or at least have higher conversion
    if (result.winner) {
      expect(result.winner).toBe('variant_b');
    }
  });
});

describe('computeStatisticalSignificance', () => {
  it('detects significant difference', () => {
    const control = { name: 'control', weight: 0.5, users: 5000, conversions: 250, conversion_rate: 5.0 };
    const variant = { name: 'variant', weight: 0.5, users: 5000, conversions: 350, conversion_rate: 7.0 };
    const result = computeStatisticalSignificance(control, variant);
    expect(result.significant).toBe(true);
    expect(result.p_value).toBeLessThan(0.05);
  });

  it('detects non-significant difference', () => {
    const control = { name: 'control', weight: 0.5, users: 50, conversions: 5, conversion_rate: 10.0 };
    const variant = { name: 'variant', weight: 0.5, users: 50, conversions: 6, conversion_rate: 12.0 };
    const result = computeStatisticalSignificance(control, variant);
    expect(result.significant).toBe(false);
    expect(result.p_value).toBeGreaterThan(0.05);
  });

  it('handles zero users', () => {
    const control = { name: 'control', weight: 0.5, users: 0, conversions: 0, conversion_rate: 0 };
    const variant = { name: 'variant', weight: 0.5, users: 100, conversions: 10, conversion_rate: 10.0 };
    const result = computeStatisticalSignificance(control, variant);
    expect(result.significant).toBe(false);
    expect(result.p_value).toBe(1);
  });

  it('returns z-score', () => {
    const control = { name: 'control', weight: 0.5, users: 1000, conversions: 50, conversion_rate: 5.0 };
    const variant = { name: 'variant', weight: 0.5, users: 1000, conversions: 70, conversion_rate: 7.0 };
    const result = computeStatisticalSignificance(control, variant);
    expect(result.z_score).toBeGreaterThan(0);
  });
});
