// ---------------------------------------------------------------------------
// date-utils.test.ts -- Tests for date utilities
// ---------------------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import { isoNow, isoDate, daysAgo, daysFromNow, formatRelative, isOverdue } from '../../src/core/utils/date.js';

describe('isoNow', () => {
  it('returns a valid ISO string', () => {
    const now = isoNow();
    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns current time', () => {
    const now = Date.now();
    const isoTime = new Date(isoNow()).getTime();
    expect(Math.abs(isoTime - now)).toBeLessThan(2000);
  });
});

describe('isoDate', () => {
  it('returns date portion of ISO string', () => {
    const date = new Date('2026-01-15T10:30:00Z');
    expect(isoDate(date)).toBe('2026-01-15');
  });

  it('returns correct format', () => {
    const result = isoDate(new Date());
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('daysAgo', () => {
  it('returns a date in the past', () => {
    const result = daysAgo(7);
    expect(result.getTime()).toBeLessThan(Date.now());
  });

  it('returns correct number of days ago', () => {
    const result = daysAgo(1);
    const diff = Date.now() - result.getTime();
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(1);
  });
});

describe('daysFromNow', () => {
  it('returns a date in the future', () => {
    const result = daysFromNow(7);
    expect(result.getTime()).toBeGreaterThan(Date.now());
  });

  it('returns correct number of days ahead', () => {
    const result = daysFromNow(1);
    const diff = result.getTime() - Date.now();
    const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(1);
  });
});

describe('formatRelative', () => {
  it('formats recent past as minutes ago', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(formatRelative(tenMinAgo)).toBe('10m ago');
  });

  it('formats hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(twoHoursAgo)).toBe('2h ago');
  });

  it('formats days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(threeDaysAgo)).toBe('3d ago');
  });

  it('formats future as "in X"', () => {
    const inOneHour = new Date(Date.now() + 61 * 60 * 1000).toISOString();
    expect(formatRelative(inOneHour)).toMatch(/^in \d+h$/);
  });

  it('formats near future as "in Xm"', () => {
    const in30Min = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    expect(formatRelative(in30Min)).toMatch(/^in \d+m$/);
  });
});

describe('isOverdue', () => {
  it('returns true for past dates', () => {
    expect(isOverdue('2020-01-01T00:00:00Z')).toBe(true);
  });

  it('returns false for future dates', () => {
    expect(isOverdue('2099-01-01T00:00:00Z')).toBe(false);
  });
});
