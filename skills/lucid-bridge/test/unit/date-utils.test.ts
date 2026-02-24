import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nowISO, parseDate, formatDate, formatDateTime, timeAgo, isValidCron } from '../../src/core/utils/date.js';

describe('date utils', () => {
  // --- nowISO ---
  describe('nowISO', () => {
    it('returns a valid ISO string', () => {
      const iso = nowISO();
      expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('returns current time', () => {
      const before = new Date().toISOString();
      const iso = nowISO();
      const after = new Date().toISOString();
      expect(iso >= before).toBe(true);
      expect(iso <= after).toBe(true);
    });
  });

  // --- parseDate ---
  describe('parseDate', () => {
    it('parses a valid date string', () => {
      const d = parseDate('2025-01-15T10:00:00Z');
      expect(d).toBeInstanceOf(Date);
      expect(d!.getFullYear()).toBe(2025);
    });

    it('returns null for invalid date', () => {
      expect(parseDate('not-a-date')).toBeNull();
    });

    it('returns null for null', () => {
      expect(parseDate(null)).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(parseDate(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseDate('')).toBeNull();
    });

    it('parses ISO date', () => {
      const d = parseDate('2025-06-15');
      expect(d).toBeInstanceOf(Date);
    });
  });

  // --- formatDate ---
  describe('formatDate', () => {
    it('formats a date', () => {
      const d = new Date('2025-01-15T00:00:00Z');
      const formatted = formatDate(d);
      expect(formatted).toContain('2025');
      expect(formatted).toContain('Jan');
    });
  });

  // --- formatDateTime ---
  describe('formatDateTime', () => {
    it('formats a date with time', () => {
      const d = new Date('2025-01-15T14:30:00Z');
      const formatted = formatDateTime(d);
      expect(formatted).toContain('2025');
      expect(formatted).toContain('Jan');
    });
  });

  // --- timeAgo ---
  describe('timeAgo', () => {
    it('returns "just now" for very recent', () => {
      const d = new Date(Date.now() - 5 * 1000); // 5 seconds ago
      expect(timeAgo(d)).toBe('just now');
    });

    it('returns minutes ago', () => {
      const d = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      expect(timeAgo(d)).toBe('5m ago');
    });

    it('returns hours ago', () => {
      const d = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      expect(timeAgo(d)).toBe('3h ago');
    });

    it('returns days ago', () => {
      const d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago
      expect(timeAgo(d)).toBe('5d ago');
    });

    it('returns formatted date for old dates', () => {
      const d = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
      const result = timeAgo(d);
      // Should fall through to formatDate
      expect(result).not.toContain('ago');
    });
  });

  // --- isValidCron ---
  describe('isValidCron', () => {
    it('returns true for 5-part cron', () => {
      expect(isValidCron('*/30 * * * *')).toBe(true);
    });

    it('returns true for 6-part cron', () => {
      expect(isValidCron('0 */5 * * * *')).toBe(true);
    });

    it('returns false for invalid cron', () => {
      expect(isValidCron('not a cron')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidCron('')).toBe(false);
    });

    it('returns false for 4-part expression', () => {
      expect(isValidCron('* * * *')).toBe(false);
    });

    it('returns true for common patterns', () => {
      expect(isValidCron('0 0 * * *')).toBe(true); // daily at midnight
      expect(isValidCron('0 9 * * 1')).toBe(true); // Monday at 9am
    });
  });
});
