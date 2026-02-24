// ---------------------------------------------------------------------------
// text-utils.test.ts -- Tests for text utilities
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  truncate,
  stripHtml,
  wordCount,
  extractSentences,
  formatDuration,
  formatList,
  slugify,
  capitalizeFirst,
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

  it('handles text without HTML', () => {
    expect(stripHtml('plain text')).toBe('plain text');
  });
});

describe('wordCount', () => {
  it('counts words correctly', () => {
    expect(wordCount('hello world')).toBe(2);
  });

  it('returns 0 for empty string', () => {
    expect(wordCount('')).toBe(0);
  });

  it('returns 0 for whitespace only', () => {
    expect(wordCount('   ')).toBe(0);
  });

  it('handles multiple spaces', () => {
    expect(wordCount('hello   world')).toBe(2);
  });

  it('counts single word', () => {
    expect(wordCount('hello')).toBe(1);
  });
});

describe('extractSentences', () => {
  it('splits on periods', () => {
    const sentences = extractSentences('Hello world. How are you.');
    expect(sentences.length).toBe(2);
  });

  it('splits on question marks', () => {
    const sentences = extractSentences('What is this? Is it good?');
    expect(sentences.length).toBe(2);
  });

  it('splits on exclamation marks', () => {
    const sentences = extractSentences('Great work! Amazing job!');
    expect(sentences.length).toBe(2);
  });

  it('filters out empty strings', () => {
    const sentences = extractSentences('Hello...');
    expect(sentences.length).toBe(1);
    expect(sentences[0]).toBe('Hello');
  });

  it('handles empty input', () => {
    expect(extractSentences('')).toEqual([]);
  });
});

describe('formatDuration', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(30)).toBe('30m');
  });

  it('formats exact hours', () => {
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(120)).toBe('2h');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('formatList', () => {
  it('returns empty for no items', () => {
    expect(formatList([])).toBe('');
  });

  it('returns single item', () => {
    expect(formatList(['Alice'])).toBe('Alice');
  });

  it('joins two items with and', () => {
    expect(formatList(['Alice', 'Bob'])).toBe('Alice and Bob');
  });

  it('joins three items with Oxford comma', () => {
    expect(formatList(['Alice', 'Bob', 'Charlie'])).toBe('Alice, Bob, and Charlie');
  });

  it('uses custom conjunction', () => {
    expect(formatList(['Alice', 'Bob'], 'or')).toBe('Alice or Bob');
  });

  it('handles four items', () => {
    expect(formatList(['A', 'B', 'C', 'D'])).toBe('A, B, C, and D');
  });
});

describe('slugify', () => {
  it('converts to lowercase kebab-case', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Sprint Planning #1!')).toBe('sprint-planning-1');
  });

  it('trims leading/trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('capitalizeFirst', () => {
  it('capitalizes first character', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
  });

  it('handles single character', () => {
    expect(capitalizeFirst('h')).toBe('H');
  });

  it('handles empty string', () => {
    expect(capitalizeFirst('')).toBe('');
  });

  it('preserves rest of string', () => {
    expect(capitalizeFirst('hELLO')).toBe('HELLO');
  });
});
