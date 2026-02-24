// ---------------------------------------------------------------------------
// prompts.test.ts -- Tests for AI prompt templates
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  FEEDBACK_ANALYSIS_PROMPT,
  NPS_REPORT_PROMPT,
  RESPONSE_PROMPT,
  buildNpsReportPrompt,
  buildInsightsSummary,
} from '../../src/core/analysis/prompts.js';
import type { NpsResult, TrendData } from '../../src/core/analysis/trend-detector.js';
import type { Theme } from '../../src/core/analysis/sentiment-analyzer.js';
import type { FeatureRequest } from '../../src/core/analysis/categorizer.js';

const mockNps: NpsResult = {
  nps: 35,
  detractors: 20,
  passives: 30,
  promoters: 50,
  total: 100,
  detractor_pct: 20,
  passive_pct: 30,
  promoter_pct: 50,
};

const mockThemes: Theme[] = [
  { name: 'performance', count: 25, sentiment_avg: -0.3, keywords: ['slow', 'lag'] },
  { name: 'usability', count: 15, sentiment_avg: 0.2, keywords: ['easy', 'confusing'] },
];

const mockTrends: TrendData[] = [
  {
    period: '2026-01',
    category: null,
    sentiment_avg: 0.2,
    volume: 100,
    nps_score: 30,
    top_themes: ['performance'],
    change_pct: null,
  },
  {
    period: '2026-02',
    category: null,
    sentiment_avg: 0.35,
    volume: 120,
    nps_score: 35,
    top_themes: ['usability'],
    change_pct: 20,
  },
];

const mockFeatureRequests: FeatureRequest[] = [
  { content: 'Please add dark mode', category: 'feature_request', priority: 'medium', keywords: ['feature'], sentiment: 'positive' },
  { content: 'Need API webhooks integration', category: 'feature_request', priority: 'high', keywords: ['feature', 'integration'], sentiment: 'neutral' },
];

describe('FEEDBACK_ANALYSIS_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof FEEDBACK_ANALYSIS_PROMPT).toBe('string');
    expect(FEEDBACK_ANALYSIS_PROMPT.length).toBeGreaterThan(50);
  });

  it('mentions sentiment', () => {
    expect(FEEDBACK_ANALYSIS_PROMPT.toLowerCase()).toContain('sentiment');
  });

  it('mentions action items', () => {
    expect(FEEDBACK_ANALYSIS_PROMPT.toLowerCase()).toContain('action');
  });
});

describe('NPS_REPORT_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof NPS_REPORT_PROMPT).toBe('string');
    expect(NPS_REPORT_PROMPT.length).toBeGreaterThan(50);
  });

  it('mentions NPS', () => {
    expect(NPS_REPORT_PROMPT).toContain('NPS');
  });
});

describe('RESPONSE_PROMPT', () => {
  it('is a non-empty string', () => {
    expect(typeof RESPONSE_PROMPT).toBe('string');
    expect(RESPONSE_PROMPT.length).toBeGreaterThan(50);
  });

  it('mentions acknowledge', () => {
    expect(RESPONSE_PROMPT.toLowerCase()).toContain('acknowledge');
  });
});

describe('buildNpsReportPrompt', () => {
  it('includes NPS score', () => {
    const report = buildNpsReportPrompt(mockNps, []);
    expect(report).toContain('35');
  });

  it('includes total responses', () => {
    const report = buildNpsReportPrompt(mockNps, []);
    expect(report).toContain('100');
  });

  it('includes promoter/passive/detractor counts', () => {
    const report = buildNpsReportPrompt(mockNps, []);
    expect(report).toContain('Promoters');
    expect(report).toContain('Passives');
    expect(report).toContain('Detractors');
  });

  it('includes themes when provided', () => {
    const report = buildNpsReportPrompt(mockNps, mockThemes);
    expect(report).toContain('performance');
    expect(report).toContain('usability');
  });

  it('handles empty themes', () => {
    const report = buildNpsReportPrompt(mockNps, []);
    expect(report).not.toContain('Top Themes');
  });
});

describe('buildInsightsSummary', () => {
  it('includes NPS overview when provided', () => {
    const summary = buildInsightsSummary([], [], [], mockNps);
    expect(summary).toContain('NPS Overview');
    expect(summary).toContain('35');
  });

  it('omits NPS overview when null', () => {
    const summary = buildInsightsSummary([], [], [], null);
    expect(summary).not.toContain('NPS Overview');
  });

  it('includes themes when provided', () => {
    const summary = buildInsightsSummary([], mockThemes, [], null);
    expect(summary).toContain('Top Themes');
    expect(summary).toContain('performance');
  });

  it('includes feature requests when provided', () => {
    const summary = buildInsightsSummary([], [], mockFeatureRequests, null);
    expect(summary).toContain('Top Feature Requests');
    expect(summary).toContain('dark mode');
  });

  it('includes latest trend when provided', () => {
    const summary = buildInsightsSummary(mockTrends, [], [], null);
    expect(summary).toContain('Latest Trend');
    expect(summary).toContain('2026-02');
  });

  it('includes volume change percentage', () => {
    const summary = buildInsightsSummary(mockTrends, [], [], null);
    expect(summary).toContain('+20');
  });

  it('handles all empty inputs', () => {
    const summary = buildInsightsSummary([], [], [], null);
    expect(summary).toContain('Feedback Insights Summary');
  });
});
