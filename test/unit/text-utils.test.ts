// ---------------------------------------------------------------------------
// text-utils.test.ts -- Tests for text utilities
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  truncate,
  stripHtml,
  formatNumber,
  formatUsd,
  formatPct,
  countWords,
  countSyllables,
  calculateKeywordDensity,
} from '../../src/core/utils/text.js';

describe('truncate', () => {
  it('returns string unchanged if shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis', () => {
    expect(truncate('hello world foo bar', 10)).toBe('hello w...');
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('stripHtml', () => {
  it('removes HTML tags', () => {
    expect(stripHtml('<p>Hello <b>world</b></p>')).toBe('Hello world');
  });

  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });
});

describe('formatNumber', () => {
  it('formats billions', () => {
    expect(formatNumber(1_500_000_000)).toBe('1.50B');
  });

  it('formats millions', () => {
    expect(formatNumber(2_500_000)).toBe('2.50M');
  });

  it('formats thousands', () => {
    expect(formatNumber(15_000)).toBe('15.00K');
  });

  it('formats small numbers', () => {
    expect(formatNumber(42)).toBe('42.00');
  });
});

describe('formatUsd', () => {
  it('formats with dollar sign', () => {
    expect(formatUsd(1_000_000)).toBe('$1.00M');
  });
});

describe('formatPct', () => {
  it('formats percentage', () => {
    expect(formatPct(50.123)).toBe('50.12%');
  });
});

describe('countWords', () => {
  it('counts words in plain text', () => {
    expect(countWords('hello world foo bar')).toBe(4);
  });

  it('strips HTML before counting', () => {
    expect(countWords('<p>hello <b>world</b></p>')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(countWords('')).toBe(0);
  });
});

describe('countSyllables', () => {
  it('counts syllables in common words', () => {
    expect(countSyllables('the')).toBe(1);
    expect(countSyllables('hello')).toBe(2);
    expect(countSyllables('beautiful')).toBe(3);
  });

  it('returns at least 1 for any word', () => {
    expect(countSyllables('a')).toBeGreaterThanOrEqual(1);
  });
});

describe('calculateKeywordDensity', () => {
  it('calculates density correctly', () => {
    const text = 'seo tools are great tools for seo tools usage';
    const density = calculateKeywordDensity(text, 'seo tools');
    expect(density).toBeGreaterThan(0);
  });

  it('returns 0 when keyword not present', () => {
    expect(calculateKeywordDensity('hello world', 'seo')).toBe(0);
  });

  it('returns 0 for empty text', () => {
    expect(calculateKeywordDensity('', 'seo')).toBe(0);
  });
});
