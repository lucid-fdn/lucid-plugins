import { describe, it, expect } from 'vitest';
import {
  analyzePipeline,
  predictTimeToHire,
  identifyDropoffPoints,
} from '../src/core/analysis/pipeline-analyzer.js';
import type { Application } from '../src/core/types/database.js';

function makeApplication(overrides: Partial<Application> = {}): Application {
  const now = new Date().toISOString();
  return {
    id: `app-${Math.random().toString(36).slice(2, 8)}`,
    tenant_id: 'test',
    job_id: 'job-1',
    candidate_id: `cand-${Math.random().toString(36).slice(2, 8)}`,
    stage: 'applied',
    score: null,
    match_score: null,
    applied_at: now,
    stage_changed_at: now,
    rejection_reason: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('analyzePipeline', () => {
  it('returns empty metrics for no applications', () => {
    const metrics = analyzePipeline([]);
    expect(metrics.total_applications).toBe(0);
    expect(metrics.bottleneck_stage).toBeNull();
  });

  it('counts applications by stage', () => {
    const apps = [
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'screening' }),
      makeApplication({ stage: 'interview' }),
      makeApplication({ stage: 'hired' }),
    ];
    const metrics = analyzePipeline(apps);
    expect(metrics.by_stage['applied']).toBe(2);
    expect(metrics.by_stage['screening']).toBe(1);
    expect(metrics.by_stage['interview']).toBe(1);
    expect(metrics.by_stage['hired']).toBe(1);
    expect(metrics.total_applications).toBe(5);
  });

  it('identifies bottleneck stage', () => {
    const apps = [
      makeApplication({ stage: 'screening' }),
      makeApplication({ stage: 'screening' }),
      makeApplication({ stage: 'screening' }),
      makeApplication({ stage: 'interview' }),
    ];
    const metrics = analyzePipeline(apps);
    expect(metrics.bottleneck_stage).toBe('screening');
  });

  it('calculates conversion rates', () => {
    const apps = [
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'screening' }),
      makeApplication({ stage: 'interview' }),
      makeApplication({ stage: 'hired' }),
    ];
    const metrics = analyzePipeline(apps);
    expect(metrics.conversion_rates).toBeDefined();
    expect(Object.keys(metrics.conversion_rates).length).toBeGreaterThan(0);
  });

  it('handles all applications in one stage', () => {
    const apps = [
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'applied' }),
    ];
    const metrics = analyzePipeline(apps);
    expect(metrics.bottleneck_stage).toBe('applied');
    expect(metrics.total_applications).toBe(3);
  });
});

describe('predictTimeToHire', () => {
  it('returns default for no hired candidates', () => {
    const apps = [makeApplication({ stage: 'applied' })];
    expect(predictTimeToHire(apps)).toBe(30);
  });

  it('calculates average time for hired candidates', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    const apps = [
      makeApplication({
        stage: 'hired',
        applied_at: twoWeeksAgo,
        stage_changed_at: new Date().toISOString(),
      }),
    ];
    const prediction = predictTimeToHire(apps);
    expect(prediction).toBeGreaterThanOrEqual(13);
    expect(prediction).toBeLessThanOrEqual(15);
  });

  it('averages multiple hires', () => {
    const apps = [
      makeApplication({
        stage: 'hired',
        applied_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        stage_changed_at: new Date().toISOString(),
      }),
      makeApplication({
        stage: 'hired',
        applied_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        stage_changed_at: new Date().toISOString(),
      }),
    ];
    const prediction = predictTimeToHire(apps);
    expect(prediction).toBeGreaterThanOrEqual(14);
    expect(prediction).toBeLessThanOrEqual(16);
  });
});

describe('identifyDropoffPoints', () => {
  it('returns empty for no dropoffs', () => {
    const dropoffs = identifyDropoffPoints([]);
    expect(dropoffs).toEqual([]);
  });

  it('identifies stages with high dropoff', () => {
    const apps = [
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'screening' }),
      makeApplication({ stage: 'hired' }),
    ];
    const dropoffs = identifyDropoffPoints(apps);
    expect(dropoffs.length).toBeGreaterThan(0);
    expect(dropoffs[0]!.dropoff_rate).toBeGreaterThan(0);
  });

  it('sorts by dropoff rate descending', () => {
    const apps = [
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'applied' }),
      makeApplication({ stage: 'screening' }),
      makeApplication({ stage: 'interview' }),
      makeApplication({ stage: 'hired' }),
    ];
    const dropoffs = identifyDropoffPoints(apps);
    for (let i = 1; i < dropoffs.length; i++) {
      expect(dropoffs[i]!.dropoff_rate).toBeLessThanOrEqual(dropoffs[i - 1]!.dropoff_rate);
    }
  });
});
