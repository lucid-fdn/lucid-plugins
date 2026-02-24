import { describe, it, expect } from 'vitest';
import {
  calculateFixedPrice,
  calculateHourlyEstimate,
  calculateRetainer,
  calculateMilestoneBreakdown,
  applyDiscount,
} from '../src/core/analysis/pricing-calculator.js';

describe('pricing-calculator', () => {
  describe('calculateFixedPrice', () => {
    it('calculates total from line items with contingency', () => {
      const items = [
        { description: 'Design', hours: 40, rate: 150 },
        { description: 'Development', hours: 160, rate: 200 },
      ];
      const result = calculateFixedPrice(items, 10);

      expect(result.subtotal).toBe(40 * 150 + 160 * 200);
      expect(result.contingency).toBe(Math.round(result.subtotal * 0.1));
      expect(result.total).toBe(result.subtotal + result.contingency);
      expect(result.line_items).toHaveLength(2);
    });

    it('throws on empty items', () => {
      expect(() => calculateFixedPrice([], 10)).toThrow();
    });

    it('uses 0 contingency when specified', () => {
      const items = [{ description: 'Work', hours: 10, rate: 100 }];
      const result = calculateFixedPrice(items, 0);
      expect(result.contingency).toBe(0);
      expect(result.total).toBe(1000);
    });
  });

  describe('calculateHourlyEstimate', () => {
    it('calculates hourly estimate with contingency', () => {
      const result = calculateHourlyEstimate(100, 150, 15);

      expect(result.subtotal).toBe(15000);
      expect(result.contingency).toBe(Math.round(15000 * 0.15));
      expect(result.total).toBe(result.subtotal + result.contingency);
    });

    it('throws on zero hours', () => {
      expect(() => calculateHourlyEstimate(0, 150, 15)).toThrow();
    });

    it('throws on negative rate', () => {
      expect(() => calculateHourlyEstimate(100, -50, 15)).toThrow();
    });

    it('returns line item with correct values', () => {
      const result = calculateHourlyEstimate(80, 200, 10);
      expect(result.line_items).toHaveLength(1);
      expect(result.line_items[0]?.quantity).toBe(80);
      expect(result.line_items[0]?.unit_price).toBe(200);
    });
  });

  describe('calculateRetainer', () => {
    it('calculates monthly and annual retainer', () => {
      const result = calculateRetainer(40, 150, 10);

      expect(result.monthly_hours).toBe(40);
      expect(result.hourly_rate).toBe(150);
      expect(result.monthly_total).toBe(6000);
      expect(result.discount_percentage).toBe(10);
      expect(result.discounted_monthly).toBe(5400);
      expect(result.annual_total).toBe(64800);
    });

    it('works with no discount', () => {
      const result = calculateRetainer(20, 100, 0);
      expect(result.discounted_monthly).toBe(2000);
      expect(result.annual_total).toBe(24000);
    });

    it('throws on invalid discount', () => {
      expect(() => calculateRetainer(20, 100, 150)).toThrow();
    });
  });

  describe('calculateMilestoneBreakdown', () => {
    it('breaks down total by milestone percentages', () => {
      const milestones = [
        { name: 'Kickoff', percentage: 30 },
        { name: 'Delivery', percentage: 50 },
        { name: 'Closure', percentage: 20 },
      ];
      const result = calculateMilestoneBreakdown(milestones, 100000);

      expect(result).toHaveLength(3);
      expect(result[0]?.amount).toBe(30000);
      expect(result[1]?.amount).toBe(50000);
      expect(result[2]?.amount).toBe(20000);
    });

    it('throws when percentages do not sum to 100', () => {
      const milestones = [
        { name: 'Phase 1', percentage: 30 },
        { name: 'Phase 2', percentage: 30 },
      ];
      expect(() => calculateMilestoneBreakdown(milestones, 50000)).toThrow();
    });

    it('throws on empty milestones', () => {
      expect(() => calculateMilestoneBreakdown([], 50000)).toThrow();
    });
  });

  describe('applyDiscount', () => {
    it('applies percentage discount', () => {
      expect(applyDiscount(10000, 'percentage', 20)).toBe(8000);
    });

    it('applies fixed discount', () => {
      expect(applyDiscount(10000, 'fixed', 2500)).toBe(7500);
    });

    it('throws on negative amount', () => {
      expect(() => applyDiscount(-100, 'percentage', 10)).toThrow();
    });

    it('throws on percentage over 100', () => {
      expect(() => applyDiscount(1000, 'percentage', 150)).toThrow();
    });

    it('throws when fixed discount exceeds amount', () => {
      expect(() => applyDiscount(1000, 'fixed', 2000)).toThrow();
    });
  });
});
