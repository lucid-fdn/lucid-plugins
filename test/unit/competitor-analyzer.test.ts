// ---------------------------------------------------------------------------
// competitor-analyzer.test.ts -- Tests for competitor analysis
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  analyzeOverlap,
  findContentGaps,
  calculateOpportunityScore,
  compareVisibility,
  getCompetitorAdvantages,
} from '../../src/core/analysis/competitor-analyzer.js';
import type { KeywordData, CompetitorData } from '../../src/core/types/provider.js';

describe('analyzeOverlap', () => {
  it('calculates overlap between two keyword sets', () => {
    const result = analyzeOverlap(
      ['seo', 'keywords', 'backlinks'],
      ['seo', 'content', 'backlinks', 'analytics'],
    );
    expect(result.shared_keywords).toBe(2);
    expect(result.competitor_only).toBe(2);
    expect(result.our_only).toBe(1);
    expect(result.overlap_pct).toBeGreaterThan(0);
  });

  it('returns 0 overlap for disjoint sets', () => {
    const result = analyzeOverlap(['a', 'b'], ['c', 'd']);
    expect(result.shared_keywords).toBe(0);
    expect(result.overlap_pct).toBe(0);
  });

  it('returns 100% overlap for identical sets', () => {
    const result = analyzeOverlap(['a', 'b'], ['a', 'b']);
    expect(result.shared_keywords).toBe(2);
    expect(result.overlap_pct).toBe(100);
  });

  it('handles empty sets', () => {
    const result = analyzeOverlap([], []);
    expect(result.shared_keywords).toBe(0);
    expect(result.overlap_pct).toBe(0);
  });
});

describe('findContentGaps', () => {
  it('finds keywords missing from our set', () => {
    const ourKeywords = ['seo', 'backlinks'];
    const competitorData: KeywordData[] = [
      { keyword: 'seo', search_volume: 5000, cpc: 2, competition: 0.5, difficulty: 50 },
      { keyword: 'content marketing', search_volume: 8000, cpc: 3, competition: 0.6, difficulty: 55 },
      { keyword: 'link building', search_volume: 3000, cpc: 1.5, competition: 0.4, difficulty: 40 },
    ];
    const gaps = findContentGaps(ourKeywords, competitorData);
    expect(gaps.length).toBe(2);
    expect(gaps.map((g) => g.keyword)).toContain('content marketing');
    expect(gaps.map((g) => g.keyword)).toContain('link building');
  });

  it('sorts by opportunity score descending', () => {
    const gaps = findContentGaps([], [
      { keyword: 'low', search_volume: 100, cpc: 0.5, competition: 0.8, difficulty: 80 },
      { keyword: 'high', search_volume: 10000, cpc: 5, competition: 0.2, difficulty: 20 },
    ]);
    expect(gaps[0].keyword).toBe('high');
  });

  it('returns empty for no gaps', () => {
    const gaps = findContentGaps(['a', 'b'], [
      { keyword: 'a', search_volume: 1000, cpc: 1, competition: 0.5, difficulty: 50 },
    ]);
    expect(gaps).toHaveLength(0);
  });
});

describe('calculateOpportunityScore', () => {
  it('returns higher score for high volume + low difficulty', () => {
    const high = calculateOpportunityScore(10000, 20, 3);
    const low = calculateOpportunityScore(100, 80, 0.5);
    expect(high).toBeGreaterThan(low);
  });

  it('returns score between 0 and 100', () => {
    const score = calculateOpportunityScore(5000, 50, 2);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('compareVisibility', () => {
  it('shows positive difference when we lead', () => {
    const result = compareVisibility('us.com', 'them.com', 80, 60);
    expect(result.difference).toBe(20);
  });

  it('shows negative difference when competitor leads', () => {
    const result = compareVisibility('us.com', 'them.com', 40, 70);
    expect(result.difference).toBe(-30);
  });
});

describe('getCompetitorAdvantages', () => {
  it('identifies competitor advantages', () => {
    const competitors: CompetitorData[] = [
      { domain: 'big.com', shared_keywords: 100, competitor_keywords: 5000, visibility_score: 80 },
      { domain: 'small.com', shared_keywords: 50, competitor_keywords: 100, visibility_score: 30 },
    ];
    const advantages = getCompetitorAdvantages(competitors);
    expect(advantages.length).toBe(2);
    expect(advantages[0].domain).toBe('big.com');
  });

  it('returns empty for no competitors', () => {
    expect(getCompetitorAdvantages([])).toHaveLength(0);
  });
});
