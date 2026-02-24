// ---------------------------------------------------------------------------
// text-utils.test.ts -- Tests for text utility functions
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  truncate,
  stripHtml,
  formatNumber,
  formatPct,
  wordCount,
  extractHashtags,
  extractMentions,
  readingTime,
  extractUrls,
  simpleSentiment,
  suggestHashtags,
  optimalLength,
} from '../src/core/utils/text.js';

describe('truncate', () => {
  it('returns original string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and adds ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
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

  it('trims whitespace', () => {
    expect(stripHtml('  <div>text</div>  ')).toBe('text');
  });
});

describe('formatNumber', () => {
  it('formats billions', () => {
    expect(formatNumber(1500000000)).toBe('1.5B');
  });

  it('formats millions', () => {
    expect(formatNumber(2500000)).toBe('2.5M');
  });

  it('formats thousands', () => {
    expect(formatNumber(50000)).toBe('50.0K');
  });

  it('formats small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatPct', () => {
  it('formats as percentage with 2 decimals', () => {
    expect(formatPct(5.678)).toBe('5.68%');
  });

  it('handles zero', () => {
    expect(formatPct(0)).toBe('0.00%');
  });
});

describe('wordCount', () => {
  it('counts words correctly', () => {
    expect(wordCount('hello world foo')).toBe(3);
  });

  it('returns 0 for empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  it('handles multiple spaces', () => {
    expect(wordCount('hello   world')).toBe(2);
  });

  it('handles whitespace-only string', () => {
    expect(wordCount('   ')).toBe(0);
  });
});

describe('extractHashtags', () => {
  it('extracts hashtags from text', () => {
    const tags = extractHashtags('Hello #world #AI test');
    expect(tags).toContain('#world');
    expect(tags).toContain('#ai');
    expect(tags).toHaveLength(2);
  });

  it('deduplicates hashtags', () => {
    const tags = extractHashtags('#AI #ai #AI');
    expect(tags).toHaveLength(1);
  });

  it('returns empty array for no hashtags', () => {
    expect(extractHashtags('No hashtags here')).toEqual([]);
  });
});

describe('extractMentions', () => {
  it('extracts mentions from text', () => {
    const mentions = extractMentions('Hey @user1 and @user2!');
    expect(mentions).toContain('@user1');
    expect(mentions).toContain('@user2');
  });

  it('returns empty array for no mentions', () => {
    expect(extractMentions('No mentions here')).toEqual([]);
  });
});

describe('readingTime', () => {
  it('returns at least 1 minute', () => {
    expect(readingTime('Short')).toBe(1);
  });

  it('calculates based on 200 wpm', () => {
    const text = Array(400).fill('word').join(' ');
    expect(readingTime(text)).toBe(2);
  });
});

describe('extractUrls', () => {
  it('extracts URLs from text', () => {
    const urls = extractUrls('Visit https://example.com and http://test.org');
    expect(urls).toContain('https://example.com');
    expect(urls).toContain('http://test.org');
  });

  it('returns empty array for no URLs', () => {
    expect(extractUrls('No URLs here')).toEqual([]);
  });
});

describe('simpleSentiment', () => {
  it('returns positive for positive text', () => {
    const score = simpleSentiment('This is amazing and wonderful, truly the best!');
    expect(score).toBeGreaterThan(0);
  });

  it('returns negative for negative text', () => {
    const score = simpleSentiment('This is terrible and horrible, the worst ever.');
    expect(score).toBeLessThan(0);
  });

  it('returns near zero for neutral text', () => {
    const score = simpleSentiment('The sky is blue and water is wet.');
    expect(Math.abs(score)).toBeLessThanOrEqual(0.5);
  });

  it('stays within -1 to 1 range', () => {
    const score = simpleSentiment(
      'amazing awesome great excellent love best fantastic incredible wonderful brilliant outstanding perfect impressive revolutionary innovative',
    );
    expect(score).toBeLessThanOrEqual(1);
    expect(score).toBeGreaterThanOrEqual(-1);
  });
});

describe('suggestHashtags', () => {
  it('suggests AI-related hashtags for AI content', () => {
    const tags = suggestHashtags('Building an AI model for predictions', 'twitter');
    expect(tags.some((t) => t.toLowerCase().includes('ai'))).toBe(true);
  });

  it('includes platform-specific tags', () => {
    const tags = suggestHashtags('Building something cool', 'twitter');
    expect(tags).toContain('#BuildInPublic');
  });

  it('limits to 10 hashtags max', () => {
    const tags = suggestHashtags(
      'AI startup marketing crypto saas design coding product',
      'twitter',
    );
    expect(tags.length).toBeLessThanOrEqual(10);
  });
});

describe('optimalLength', () => {
  it('returns twitter optimal length', () => {
    const opt = optimalLength('twitter');
    expect(opt.max).toBe(280);
    expect(opt.ideal).toBe(200);
  });

  it('returns linkedin optimal length', () => {
    const opt = optimalLength('linkedin');
    expect(opt.max).toBe(3000);
  });

  it('returns fallback for unknown platform', () => {
    const opt = optimalLength('unknown');
    expect(opt.ideal).toBe(500);
  });
});
