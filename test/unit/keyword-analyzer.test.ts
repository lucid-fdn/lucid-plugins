// ---------------------------------------------------------------------------
// keyword-analyzer.test.ts -- Tests for keyword analysis
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  classifyIntent,
  calculateDifficulty,
  calculateDifficultyScore,
  groupKeywordsByTopic,
  suggestRelatedKeywords,
  calculateKeywordValue,
  sortByValue,
} from '../../src/core/analysis/keyword-analyzer.js';
import type { KeywordData } from '../../src/core/types/provider.js';

describe('classifyIntent', () => {
  it('classifies transactional keywords', () => {
    expect(classifyIntent('buy seo tools')).toBe('transactional');
    expect(classifyIntent('seo tool price')).toBe('transactional');
    expect(classifyIntent('cheap keyword tracker')).toBe('transactional');
  });

  it('classifies commercial keywords', () => {
    expect(classifyIntent('best seo tools')).toBe('commercial');
    expect(classifyIntent('seo tool review')).toBe('commercial');
    expect(classifyIntent('semrush vs ahrefs')).toBe('commercial');
  });

  it('classifies navigational keywords', () => {
    expect(classifyIntent('google login')).toBe('navigational');
    expect(classifyIntent('semrush website')).toBe('navigational');
  });

  it('classifies informational keywords', () => {
    expect(classifyIntent('how to do seo')).toBe('informational');
    expect(classifyIntent('what is keyword research')).toBe('informational');
    expect(classifyIntent('seo tips for beginners guide')).toBe('informational');
  });

  it('defaults short queries to navigational', () => {
    expect(classifyIntent('seo')).toBe('navigational');
    expect(classifyIntent('google analytics')).toBe('navigational');
  });
});

describe('calculateDifficulty', () => {
  it('returns easy for low competition and volume', () => {
    expect(calculateDifficulty(0.1, 500)).toBe('easy');
  });

  it('returns medium for moderate values', () => {
    expect(calculateDifficulty(0.5, 5000)).toBe('medium');
  });

  it('returns hard for high competition', () => {
    expect(calculateDifficulty(0.8, 20000)).toBe('hard');
  });

  it('returns very_hard for top competition', () => {
    expect(calculateDifficulty(0.95, 100000)).toBe('very_hard');
  });
});

describe('calculateDifficultyScore', () => {
  it('returns score between 0 and 100', () => {
    const score = calculateDifficultyScore(0.5, 10000);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns higher score for higher competition', () => {
    const low = calculateDifficultyScore(0.1, 1000);
    const high = calculateDifficultyScore(0.9, 1000);
    expect(high).toBeGreaterThan(low);
  });
});

describe('groupKeywordsByTopic', () => {
  it('groups keywords by root word', () => {
    const keywords: KeywordData[] = [
      { keyword: 'seo tools', search_volume: 1000, cpc: 2, competition: 0.5, difficulty: 50 },
      { keyword: 'best tools', search_volume: 800, cpc: 1.5, competition: 0.4, difficulty: 40 },
    ];
    const groups = groupKeywordsByTopic(keywords);
    expect(groups.size).toBeGreaterThan(0);
  });
});

describe('suggestRelatedKeywords', () => {
  it('returns suggestions for a keyword', () => {
    const suggestions = suggestRelatedKeywords('seo');
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions).toContain('what is seo');
    expect(suggestions).toContain('how to seo');
    expect(suggestions).toContain('best seo');
  });
});

describe('calculateKeywordValue', () => {
  it('calculates value from volume and CPC', () => {
    expect(calculateKeywordValue(1000, 2.50)).toBe(2500);
  });

  it('returns 0 for zero volume', () => {
    expect(calculateKeywordValue(0, 5)).toBe(0);
  });

  it('returns 0 for zero CPC', () => {
    expect(calculateKeywordValue(1000, 0)).toBe(0);
  });
});

describe('sortByValue', () => {
  it('sorts keywords by descending value', () => {
    const keywords: KeywordData[] = [
      { keyword: 'low', search_volume: 100, cpc: 0.5, competition: 0.3, difficulty: 30 },
      { keyword: 'high', search_volume: 10000, cpc: 5, competition: 0.8, difficulty: 80 },
      { keyword: 'mid', search_volume: 1000, cpc: 2, competition: 0.5, difficulty: 50 },
    ];
    const sorted = sortByValue(keywords);
    expect(sorted[0].keyword).toBe('high');
    expect(sorted[2].keyword).toBe('low');
  });
});
