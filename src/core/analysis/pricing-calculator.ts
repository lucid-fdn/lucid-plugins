import type { PricingBreakdown, RetainerPricing, MilestoneItem } from '../types/database.js';
import { ProposeError } from '../utils/errors.js';

/**
 * Calculate fixed price based on scope items and rates.
 */
export function calculateFixedPrice(
  items: Array<{ description: string; hours: number; rate: number }>,
  contingencyPercent: number = 10,
): PricingBreakdown {
  if (!items || items.length === 0) {
    throw ProposeError.badRequest('At least one item is required for fixed price calculation');
  }

  const lineItems = items.map((item) => ({
    description: item.description,
    quantity: item.hours,
    unit_price: item.rate,
    total: item.hours * item.rate,
  }));

  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const contingency = Math.round(subtotal * (contingencyPercent / 100));
  const total = subtotal + contingency;

  return {
    subtotal,
    contingency,
    total,
    currency: 'USD',
    line_items: lineItems,
  };
}

/**
 * Calculate hourly estimate with contingency.
 */
export function calculateHourlyEstimate(
  hours: number,
  rate: number,
  contingencyPercent: number = 15,
): PricingBreakdown {
  if (hours <= 0) throw ProposeError.badRequest('Hours must be positive');
  if (rate <= 0) throw ProposeError.badRequest('Rate must be positive');

  const subtotal = hours * rate;
  const contingency = Math.round(subtotal * (contingencyPercent / 100));
  const total = subtotal + contingency;

  return {
    subtotal,
    contingency,
    total,
    currency: 'USD',
    line_items: [
      {
        description: 'Hourly services',
        quantity: hours,
        unit_price: rate,
        total: subtotal,
      },
    ],
  };
}

/**
 * Calculate retainer pricing.
 */
export function calculateRetainer(
  monthlyHours: number,
  rate: number,
  discountPercent: number = 0,
): RetainerPricing {
  if (monthlyHours <= 0) throw ProposeError.badRequest('Monthly hours must be positive');
  if (rate <= 0) throw ProposeError.badRequest('Rate must be positive');
  if (discountPercent < 0 || discountPercent > 100) {
    throw ProposeError.badRequest('Discount must be between 0 and 100');
  }

  const monthlyTotal = monthlyHours * rate;
  const discountAmount = monthlyTotal * (discountPercent / 100);
  const discountedMonthly = monthlyTotal - discountAmount;
  const annualTotal = discountedMonthly * 12;

  return {
    monthly_hours: monthlyHours,
    hourly_rate: rate,
    monthly_total: monthlyTotal,
    discount_percentage: discountPercent,
    discounted_monthly: Math.round(discountedMonthly),
    annual_total: Math.round(annualTotal),
    currency: 'USD',
  };
}

/**
 * Calculate milestone breakdown from total amount.
 */
export function calculateMilestoneBreakdown(
  milestones: Array<{ name: string; percentage: number; description?: string }>,
  total: number,
): MilestoneItem[] {
  if (!milestones || milestones.length === 0) {
    throw ProposeError.badRequest('At least one milestone is required');
  }
  if (total <= 0) throw ProposeError.badRequest('Total amount must be positive');

  const totalPercentage = milestones.reduce((sum, m) => sum + m.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 1) {
    throw ProposeError.badRequest(
      `Milestone percentages must sum to 100%, got ${totalPercentage}%`,
    );
  }

  return milestones.map((m) => ({
    name: m.name,
    percentage: m.percentage,
    amount: Math.round(total * (m.percentage / 100)),
    description: m.description ?? '',
  }));
}

/**
 * Apply a discount to an amount.
 */
export function applyDiscount(
  amount: number,
  type: 'percentage' | 'fixed',
  value: number,
): number {
  if (amount <= 0) throw ProposeError.badRequest('Amount must be positive');
  if (value < 0) throw ProposeError.badRequest('Discount value must be non-negative');

  if (type === 'percentage') {
    if (value > 100) throw ProposeError.badRequest('Percentage discount cannot exceed 100%');
    return Math.round(amount * (1 - value / 100));
  }

  if (type === 'fixed') {
    if (value > amount) throw ProposeError.badRequest('Fixed discount cannot exceed the amount');
    return Math.round(amount - value);
  }

  throw ProposeError.badRequest(`Unknown discount type: ${type}`);
}
