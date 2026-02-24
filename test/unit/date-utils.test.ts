// ---------------------------------------------------------------------------
// date-utils.test.ts -- Tests for date utilities
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { isoNow, isoDate, daysAgo, formatRelative, periodLabel } from '../../src/core/utils/date.js';

describe('isoNow', () => {
  it('returns a valid ISO string', () => {
    const now = isoNow();
    expect(new Date(now).toISOString()).toBe(now);
  });

  it('is close to current time', () => {
    const now = isoNow();
    const diff = Math.abs(Date.now() - new Date(now).getTime());
    expect(diff).toBeLessThan(1000);
  });
});

describe('isoDate', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = isoDate(new Date('2026-03-15T10:30:00Z'));
    expect(result).toBe('2026-03-15');
  });

  it('handles beginning of year', () => {
    const result = isoDate(new Date('2026-01-01T00:00:00Z'));
    expect(result).toBe('2026-01-01');
  });
});

describe('daysAgo', () => {
  it('returns a date in the past', () => {
    const result = daysAgo(7);
    expect(result.getTime()).toBeLessThan(Date.now());
  });

  it('is approximately correct number of days ago', () => {
    const result = daysAgo(30);
    const diff = Date.now() - result.getTime();
    const daysDiff = diff / (1000 * 60 * 60 * 24);
    expect(Math.abs(daysDiff - 30)).toBeLessThan(1);
  });

  it('returns today for 0 days ago', () => {
    const result = daysAgo(0);
    const today = new Date();
    expect(result.getDate()).toBe(today.getDate());
  });
});

describe('formatRelative', () => {
  it('formats minutes', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelative(fiveMinutesAgo)).toBe('5m ago');
  });

  it('formats hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatRelative(threeHoursAgo)).toBe('3h ago');
  });

  it('formats days', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(formatRelative(twoDaysAgo)).toBe('2d ago');
  });
});

describe('periodLabel', () => {
  it('returns week for <= 7 days', () => {
    expect(periodLabel(7)).toBe('week');
    expect(periodLabel(3)).toBe('week');
  });

  it('returns month for <= 30 days', () => {
    expect(periodLabel(30)).toBe('month');
    expect(periodLabel(14)).toBe('month');
  });

  it('returns quarter for <= 90 days', () => {
    expect(periodLabel(90)).toBe('quarter');
    expect(periodLabel(60)).toBe('quarter');
  });

  it('returns year for > 90 days', () => {
    expect(periodLabel(91)).toBe('year');
    expect(periodLabel(365)).toBe('year');
  });
});
