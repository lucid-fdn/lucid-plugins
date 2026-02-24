// ---------------------------------------------------------------------------
// text-utils.test.ts -- Tests for text utilities
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import {
  truncate,
  stripHtml,
  normalizeWhitespace,
  extractWords,
  wordFrequency,
  formatPct,
  formatNumber,
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

  it('handles empty string', () => {
    expect(truncate('', 10)).toBe('');
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

describe('normalizeWhitespace', () => {
  it('collapses multiple spaces', () => {
    expect(normalizeWhitespace('hello   world')).toBe('hello world');
  });

  it('trims leading/trailing spaces', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  it('handles tabs and newlines', () => {
    expect(normalizeWhitespace('hello\n\tworld')).toBe('hello world');
  });
});

describe('extractWords', () => {
  it('extracts lowercase words', () => {
    const words = extractWords('Hello World');
    expect(words).toEqual(['hello', 'world']);
  });

  it('filters out short words', () => {
    const words = extractWords('I am a big fan of it');
    expect(words).not.toContain('am');
    expect(words).not.toContain('a');
    expect(words).toContain('big');
    expect(words).toContain('fan');
  });

  it('removes punctuation', () => {
    const words = extractWords('Hello, world! How are you?');
    expect(words).toContain('hello');
    expect(words).toContain('world');
    expect(words).toContain('how');
    expect(words).toContain('are');
    expect(words).toContain('you');
  });

  it('handles empty string', () => {
    expect(extractWords('')).toEqual([]);
  });
});

describe('wordFrequency', () => {
  it('counts word occurrences', () => {
    const freq = wordFrequency(['hello', 'world', 'hello']);
    expect(freq.get('hello')).toBe(2);
    expect(freq.get('world')).toBe(1);
  });

  it('returns empty map for empty input', () => {
    expect(wordFrequency([]).size).toBe(0);
  });
});

describe('formatPct', () => {
  it('formats percentage with one decimal', () => {
    expect(formatPct(50.123)).toBe('50.1%');
  });

  it('formats zero', () => {
    expect(formatPct(0)).toBe('0.0%');
  });

  it('formats 100', () => {
    expect(formatPct(100)).toBe('100.0%');
  });
});

describe('formatNumber', () => {
  it('formats millions', () => {
    expect(formatNumber(2_500_000)).toBe('2.5M');
  });

  it('formats thousands', () => {
    expect(formatNumber(15_000)).toBe('15.0K');
  });

  it('formats small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
