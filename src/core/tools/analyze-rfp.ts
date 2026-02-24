import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { analyzeRfp } from '../analysis/rfp-analyzer.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({
  rfp_content: z.string().min(10, 'RFP content must be at least 10 characters'),
});

export const analyzeRfpTool: ToolDefinition = {
  name: 'propose_analyze_rfp',
  description:
    'Analyze RFP (Request for Proposal) content to extract requirements, evaluation criteria, deadlines, budget hints, and key themes. Provides structured analysis to guide proposal creation.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const analysis = analyzeRfp(input.rfp_content);

      return toolResult({
        message: 'RFP analysis complete',
        analysis,
        summary: {
          total_requirements: analysis.requirements.length,
          must_have_count: analysis.requirements.filter((r) => r.priority === 'must_have').length,
          criteria_count: analysis.evaluation_criteria.length,
          deadlines_found: analysis.deadlines.length,
          themes_identified: analysis.key_themes.length,
        },
      });
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to analyze RFP');
      return toolError(wrapped.message);
    }
  },
};
