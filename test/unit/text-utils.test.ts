// ---------------------------------------------------------------------------
// text-utils.test.ts -- Tests for text utilities
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { truncate, stripHtml, formatNumber, formatUsd, formatPct } from '../../src/core/utils/text.js';

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
