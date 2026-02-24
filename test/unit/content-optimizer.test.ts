// ---------------------------------------------------------------------------
// content-optimizer.test.ts -- Tests for content optimization
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  analyzeContent,
  checkReadability,
  checkKeywordDensity,
  extractHeadings,
  analyzeHeadings,
  suggestImprovements,
} from '../../src/core/analysis/content-optimizer.js';
import { MOCK_HTML_GOOD, MOCK_HTML_BAD } from '../helpers/fixtures.js';

describe('analyzeContent', () => {
  it('returns a content score object', () => {
    const result = analyzeContent(MOCK_HTML_GOOD, 'seo tools');
    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('readability');
    expect(result).toHaveProperty('keyword_density');
    expect(result).toHaveProperty('word_count');
    expect(result).toHaveProperty('has_meta_title');
    expect(result).toHaveProperty('has_meta_description');
    expect(result).toHaveProperty('heading_score');
    expect(result).toHaveProperty('suggestions');
  });

  it('scores good HTML higher than bad HTML', () => {
    const goodScore = analyzeContent(MOCK_HTML_GOOD, 'seo tools');
    const badScore = analyzeContent(MOCK_HTML_BAD, 'seo tools');
    expect(goodScore.overall).toBeGreaterThan(badScore.overall);
  });

  it('detects meta title in well-formed HTML', () => {
    const result = analyzeContent(MOCK_HTML_GOOD, 'seo tools');
    expect(result.has_meta_title).toBe(true);
  });

  it('detects missing meta title', () => {
    const result = analyzeContent(MOCK_HTML_BAD, 'seo tools');
    expect(result.has_meta_title).toBe(false);
  });

  it('detects meta description', () => {
    const good = analyzeContent(MOCK_HTML_GOOD, 'seo tools');
    const bad = analyzeContent(MOCK_HTML_BAD, 'seo tools');
    expect(good.has_meta_description).toBe(true);
    expect(bad.has_meta_description).toBe(false);
  });
});

describe('checkReadability', () => {
  it('returns a score between 0 and 100', () => {
    const score = checkReadability('This is a simple sentence. It is easy to read.');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns 0 for empty text', () => {
    expect(checkReadability('')).toBe(0);
  });
});

describe('checkKeywordDensity', () => {
  it('calculates density correctly', () => {
    const text = 'seo tools are great. the best seo tools for marketing.';
    const density = checkKeywordDensity(text, 'seo tools');
    expect(density).toBeGreaterThan(0);
  });

  it('returns 0 when keyword not found', () => {
    const density = checkKeywordDensity('hello world', 'seo tools');
    expect(density).toBe(0);
  });
});

describe('extractHeadings', () => {
  it('extracts headings from HTML', () => {
    const headings = extractHeadings(MOCK_HTML_GOOD);
    expect(headings.length).toBeGreaterThan(0);
    expect(headings[0].tag).toBe('h1');
    expect(headings[0].text).toContain('SEO Tools');
  });

  it('returns empty array for no headings', () => {
    const headings = extractHeadings('<p>No headings here</p>');
    expect(headings).toHaveLength(0);
  });
});

describe('analyzeHeadings', () => {
  it('scores proper heading structure highly', () => {
    const headings = extractHeadings(MOCK_HTML_GOOD);
    const score = analyzeHeadings(headings, 'seo tools');
    expect(score).toBeGreaterThan(50);
  });

  it('returns 0 for no headings', () => {
    expect(analyzeHeadings([], 'keyword')).toBe(0);
  });
});

describe('suggestImprovements', () => {
  it('suggests adding content when word count is low', () => {
    const suggestions = suggestImprovements({
      wordCount: 100,
      readability: 60,
      density: 1.5,
      headingScore: 80,
      hasMetaTitle: true,
      hasMetaDescription: true,
      targetKeyword: 'seo',
    });
    expect(suggestions.some((s) => s.includes('too short'))).toBe(true);
  });

  it('suggests adding meta title when missing', () => {
    const suggestions = suggestImprovements({
      wordCount: 2000,
      readability: 60,
      density: 1.5,
      headingScore: 80,
      hasMetaTitle: false,
      hasMetaDescription: true,
      targetKeyword: 'seo',
    });
    expect(suggestions.some((s) => s.includes('meta title'))).toBe(true);
  });

  it('returns no suggestions for well-optimized content', () => {
    const suggestions = suggestImprovements({
      wordCount: 2000,
      readability: 70,
      density: 1.5,
      headingScore: 80,
      hasMetaTitle: true,
      hasMetaDescription: true,
      targetKeyword: 'seo',
    });
    expect(suggestions.length).toBe(0);
  });
});
