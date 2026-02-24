import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { PRICING_MODELS } from '../types/common.js';
import {
  calculateFixedPrice,
  calculateHourlyEstimate,
  calculateRetainer,
  calculateMilestoneBreakdown,
} from '../analysis/pricing-calculator.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({
  model: z.enum(PRICING_MODELS),
  params: z.object({
    hours: z.number().optional(),
    rate: z.number().optional(),
    contingency: z.number().optional(),
    monthly_hours: z.number().optional(),
    discount: z.number().optional(),
    total: z.number().optional(),
    items: z
      .array(
        z.object({
          description: z.string(),
          hours: z.number(),
          rate: z.number(),
        }),
      )
      .optional(),
    milestones: z
      .array(
        z.object({
          name: z.string(),
          percentage: z.number(),
          description: z.string().optional(),
        }),
      )
      .optional(),
  }),
});

export const calculatePricingTool: ToolDefinition = {
  name: 'propose_calculate_pricing',
  description:
    'Calculate pricing breakdown based on the specified model (fixed, hourly, retainer, milestone, value_based, subscription). Provide relevant parameters for each model type.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const { model, params: p } = input;

      switch (model) {
        case 'fixed': {
          if (!p.items || p.items.length === 0) {
            return toolError(
              'Fixed pricing requires an "items" array with description, hours, and rate',
            );
          }
          const result = calculateFixedPrice(p.items, p.contingency ?? 10);
          return toolResult({
            message: 'Fixed price calculated',
            model: 'fixed',
            pricing: result,
          });
        }

        case 'hourly': {
          if (!p.hours || !p.rate) {
            return toolError('Hourly pricing requires "hours" and "rate" parameters');
          }
          const result = calculateHourlyEstimate(p.hours, p.rate, p.contingency ?? 15);
          return toolResult({
            message: 'Hourly estimate calculated',
            model: 'hourly',
            pricing: result,
          });
        }

        case 'retainer': {
          if (!p.monthly_hours || !p.rate) {
            return toolError('Retainer pricing requires "monthly_hours" and "rate" parameters');
          }
          const result = calculateRetainer(p.monthly_hours, p.rate, p.discount ?? 0);
          return toolResult({
            message: 'Retainer pricing calculated',
            model: 'retainer',
            pricing: result,
          });
        }

        case 'milestone': {
          if (!p.milestones || !p.total) {
            return toolError('Milestone pricing requires "milestones" array and "total" amount');
          }
          const result = calculateMilestoneBreakdown(p.milestones, p.total);
          return toolResult({
            message: 'Milestone breakdown calculated',
            model: 'milestone',
            total: p.total,
            milestones: result,
          });
        }

        case 'value_based':
        case 'subscription': {
          // Value-based and subscription use hourly estimate as a base
          if (!p.hours || !p.rate) {
            return toolError(`${model} pricing requires "hours" and "rate" parameters as a base`);
          }
          const result = calculateHourlyEstimate(p.hours, p.rate, p.contingency ?? 20);
          return toolResult({
            message: `${model} pricing calculated (based on hourly estimate)`,
            model,
            pricing: result,
            note: `Adjust the total based on value delivered or subscription terms`,
          });
        }

        default:
          return toolError(`Unknown pricing model: ${model}`);
      }
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to calculate pricing');
      return toolError(wrapped.message);
    }
  },
};
