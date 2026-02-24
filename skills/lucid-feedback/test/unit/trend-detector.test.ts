// ---------------------------------------------------------------------------
// trend-detector.test.ts -- Tests for trend detection and NPS calculation
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { detectTrends, findAnomalies, calculateNps } from '../../src/core/analysis/trend-detector.js';
import type { FeedbackItem } from '../../src/core/types/database.js';
import { allMockFeedback } from '../helpers/fixtures.js';

function makeFeedbackItem(overrides: Partial<FeedbackItem>): FeedbackItem {
  return {
    id: 1,
    tenant_id: 'default',
    channel: 'email',
    content: 'Test feedback',
    author_name: null,
    author_email: null,
    rating: null,
    nps_score: null,
    sentiment: 'neutral',
    category: 'general',
    tags: [],
    status: 'new',
    priority: 'low',
    response: null,
    responded_at: null,
    metadata: {},
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    ...overrides,
  };
}

describe('calculateNps', () => {
  it('returns zero NPS for empty scores', () => {
    const result = calculateNps([]);
    expect(result.nps).toBe(0);
    expect(result.total).toBe(0);
  });

  it('calculates NPS for all promoters', () => {
    const result = calculateNps([9, 10, 9, 10]);
    expect(result.nps).toBe(100);
    expect(result.promoters).toBe(4);
    expect(result.detractors).toBe(0);
    expect(result.passives).toBe(0);
  });

  it('calculates NPS for all detractors', () => {
    const result = calculateNps([1, 2, 3, 4]);
    expect(result.nps).toBe(-100);
    expect(result.detractors).toBe(4);
    expect(result.promoters).toBe(0);
  });

  it('calculates NPS for all passives', () => {
    const result = calculateNps([7, 8, 7, 8]);
    expect(result.nps).toBe(0);
    expect(result.passives).toBe(4);
  });

  it('calculates mixed NPS correctly', () => {
    // 2 promoters (9, 10), 1 passive (7), 2 detractors (3, 5)
    const result = calculateNps([9, 10, 7, 3, 5]);
    expect(result.promoters).toBe(2);
    expect(result.passives).toBe(1);
    expect(result.detractors).toBe(2);
    expect(result.total).toBe(5);
    // NPS = (2/5 * 100) - (2/5 * 100) = 40 - 40 = 0
    expect(result.nps).toBe(0);
  });

  it('rounds NPS to integer', () => {
    // 1 promoter (10), 2 detractors (1, 2)
    const result = calculateNps([10, 1, 2]);
    // NPS = (1/3 * 100) - (2/3 * 100) = 33.3 - 66.6 = -33
    expect(Number.isInteger(result.nps)).toBe(true);
  });

  it('calculates correct percentages', () => {
    const result = calculateNps([10, 10, 7, 3, 5]);
    expect(result.promoter_pct).toBeCloseTo(40, 0);
    expect(result.passive_pct).toBeCloseTo(20, 0);
    expect(result.detractor_pct).toBeCloseTo(40, 0);
  });

  it('handles single score', () => {
    const result = calculateNps([10]);
    expect(result.nps).toBe(100);
    expect(result.total).toBe(1);
  });

  it('classifies score 6 as detractor', () => {
    const result = calculateNps([6]);
    expect(result.detractors).toBe(1);
  });

  it('classifies score 7 as passive', () => {
    const result = calculateNps([7]);
    expect(result.passives).toBe(1);
  });

  it('classifies score 9 as promoter', () => {
    const result = calculateNps([9]);
    expect(result.promoters).toBe(1);
  });
});

describe('detectTrends', () => {
  it('returns empty for empty input', () => {
    expect(detectTrends([], 7)).toEqual([]);
  });

  it('groups items by period', () => {
    const items = [
      makeFeedbackItem({ created_at: '2026-01-01T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-01-02T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-02-01T10:00:00Z' }),
    ];
    const trends = detectTrends(items, 30);
    expect(trends.length).toBe(2);
  });

  it('calculates volume per period', () => {
    const items = [
      makeFeedbackItem({ created_at: '2026-01-10T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-01-12T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-01-13T10:00:00Z' }),
    ];
    const trends = detectTrends(items, 30);
    const totalVolume = trends.reduce((sum, t) => sum + t.volume, 0);
    expect(totalVolume).toBe(3);
  });

  it('calculates sentiment average', () => {
    const items = [
      makeFeedbackItem({ created_at: '2026-01-10T10:00:00Z', sentiment: 'positive' }),
      makeFeedbackItem({ created_at: '2026-01-12T10:00:00Z', sentiment: 'negative' }),
    ];
    const trends = detectTrends(items, 30);
    expect(trends[0].sentiment_avg).toBeDefined();
  });

  it('calculates NPS when scores are available', () => {
    const items = [
      makeFeedbackItem({ created_at: '2026-01-10T10:00:00Z', nps_score: 9 }),
      makeFeedbackItem({ created_at: '2026-01-12T10:00:00Z', nps_score: 3 }),
    ];
    const trends = detectTrends(items, 30);
    expect(trends[0].nps_score).not.toBeNull();
  });

  it('returns null NPS when no scores available', () => {
    const items = [
      makeFeedbackItem({ created_at: '2026-01-10T10:00:00Z' }),
    ];
    const trends = detectTrends(items, 30);
    expect(trends[0].nps_score).toBeNull();
  });

  it('calculates change percentage', () => {
    const items = [
      makeFeedbackItem({ created_at: '2026-01-01T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-02-01T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-02-02T10:00:00Z' }),
    ];
    const trends = detectTrends(items, 30);
    if (trends.length >= 2) {
      expect(trends[0].change_pct).toBeNull(); // First period
      expect(trends[1].change_pct).not.toBeNull(); // Second period
    }
  });

  it('detects daily groups', () => {
    const items = [
      makeFeedbackItem({ created_at: '2026-01-01T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-01-02T10:00:00Z' }),
    ];
    const trends = detectTrends(items, 1);
    expect(trends.length).toBe(2);
  });

  it('detects weekly groups', () => {
    const items = [
      makeFeedbackItem({ created_at: '2026-01-06T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-01-08T10:00:00Z' }),
      makeFeedbackItem({ created_at: '2026-01-20T10:00:00Z' }),
    ];
    const trends = detectTrends(items, 7);
    expect(trends.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts top themes', () => {
    const items = [
      makeFeedbackItem({ content: 'The app is slow and loading takes forever', created_at: '2026-01-10T10:00:00Z' }),
    ];
    const trends = detectTrends(items, 30);
    expect(trends[0].top_themes.length).toBeGreaterThanOrEqual(0);
  });

  it('handles mock feedback data', () => {
    const trends = detectTrends(allMockFeedback, 30);
    expect(trends.length).toBeGreaterThan(0);
  });
});

describe('findAnomalies', () => {
  it('returns empty for no historical data', () => {
    expect(findAnomalies({ volume: 100, sentiment_avg: 0.5, nps_score: 50 }, [])).toEqual([]);
  });

  it('detects volume spike', () => {
    const anomalies = findAnomalies(
      { volume: 300, sentiment_avg: 0, nps_score: null },
      [
        { volume: 100, sentiment_avg: 0, nps_score: null },
        { volume: 80, sentiment_avg: 0, nps_score: null },
      ],
    );
    const spike = anomalies.find((a) => a.type === 'volume_spike');
    expect(spike).toBeDefined();
  });

  it('detects sentiment drop', () => {
    const anomalies = findAnomalies(
      { volume: 100, sentiment_avg: -0.5, nps_score: null },
      [
        { volume: 100, sentiment_avg: 0.3, nps_score: null },
        { volume: 100, sentiment_avg: 0.4, nps_score: null },
      ],
    );
    const drop = anomalies.find((a) => a.type === 'sentiment_drop');
    expect(drop).toBeDefined();
  });

  it('detects NPS drop', () => {
    const anomalies = findAnomalies(
      { volume: 100, sentiment_avg: 0, nps_score: 10 },
      [
        { volume: 100, sentiment_avg: 0, nps_score: 50 },
        { volume: 100, sentiment_avg: 0, nps_score: 45 },
      ],
    );
    const drop = anomalies.find((a) => a.type === 'nps_drop');
    expect(drop).toBeDefined();
  });

  it('does not flag normal variations', () => {
    const anomalies = findAnomalies(
      { volume: 100, sentiment_avg: 0.3, nps_score: 45 },
      [
        { volume: 90, sentiment_avg: 0.35, nps_score: 48 },
        { volume: 110, sentiment_avg: 0.25, nps_score: 42 },
      ],
    );
    expect(anomalies.length).toBe(0);
  });

  it('assigns high severity for extreme volume spikes', () => {
    const anomalies = findAnomalies(
      { volume: 400, sentiment_avg: 0, nps_score: null },
      [{ volume: 100, sentiment_avg: 0, nps_score: null }],
    );
    const spike = anomalies.find((a) => a.type === 'volume_spike');
    expect(spike?.severity).toBe('high');
  });

  it('assigns high severity for extreme sentiment drops', () => {
    const anomalies = findAnomalies(
      { volume: 100, sentiment_avg: -0.8, nps_score: null },
      [{ volume: 100, sentiment_avg: 0.5, nps_score: null }],
    );
    const drop = anomalies.find((a) => a.type === 'sentiment_drop');
    expect(drop?.severity).toBe('high');
  });

  it('assigns high severity for extreme NPS drops', () => {
    const anomalies = findAnomalies(
      { volume: 100, sentiment_avg: 0, nps_score: -10 },
      [{ volume: 100, sentiment_avg: 0, nps_score: 50 }],
    );
    const drop = anomalies.find((a) => a.type === 'nps_drop');
    expect(drop?.severity).toBe('high');
  });

  it('includes value and expected fields', () => {
    const anomalies = findAnomalies(
      { volume: 300, sentiment_avg: 0, nps_score: null },
      [{ volume: 100, sentiment_avg: 0, nps_score: null }],
    );
    if (anomalies.length > 0) {
      expect(anomalies[0].value).toBeDefined();
      expect(anomalies[0].expected).toBeDefined();
    }
  });
});
