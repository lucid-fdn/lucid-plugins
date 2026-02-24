import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { getSupabaseClient } from '../db/client.js';
import { getProposal } from '../db/proposals.js';
import { scoreProposal } from '../analysis/proposal-scorer.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({
  proposal_id: z.string().min(1, 'Proposal ID is required'),
});

export const scoreProposalTool: ToolDefinition = {
  name: 'propose_score_proposal',
  description:
    'Score a proposal on completeness, clarity, pricing alignment, and compliance. Returns a total score (0-100) with a detailed breakdown and actionable improvement suggestions.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const db = getSupabaseClient();

      const proposal = await getProposal(db, input.proposal_id);
      const score = scoreProposal(proposal);

      const rating =
        score.total >= 80
          ? 'Excellent'
          : score.total >= 60
            ? 'Good'
            : score.total >= 40
              ? 'Fair'
              : 'Needs Improvement';

      return toolResult({
        message: `Proposal scored: ${score.total}/100 (${rating})`,
        proposal_id: input.proposal_id,
        title: proposal.title,
        score,
        rating,
      });
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to score proposal');
      return toolError(wrapped.message);
    }
  },
};
