import { describe, it, expect } from 'vitest';
import { daysAgo, isWithinDays, toISODate } from '../../../src/core/utils/date.js';

describe('date utils', () => {
  describe('daysAgo', () => {
    it('returns date N days in the past', () => {
      const d = daysAgo(1);
      const diff = Date.now() - d.getTime();
      expect(diff).toBeGreaterThan(23 * 3600000);
      expect(diff).toBeLessThan(25 * 3600000);
    });
  });

  describe('isWithinDays', () => {
    it('returns true for recent dates', () => {
      expect(isWithinDays(new Date().toISOString(), 1)).toBe(true);
    });
    it('returns false for old dates', () => {
      const old = new Date(Date.now() - 10 * 86400000).toISOString();
      expect(isWithinDays(old, 5)).toBe(false);
    });
  });

  describe('toISODate', () => {
    it('formats as YYYY-MM-DD', () => {
      const d = new Date('2024-03-15T12:00:00Z');
      expect(toISODate(d)).toBe('2024-03-15');
    });
  });
});
