import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import type { ProposalComparison } from '../types/database.js';
import { getSupabaseClient } from '../db/client.js';
import { getProposal } from '../db/proposals.js';
import { scoreProposal } from '../analysis/proposal-scorer.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({
  proposal_ids: z.array(z.string()).min(2, 'At least 2 proposal IDs are required'),
});

export const compareProposalsTool: ToolDefinition = {
  name: 'propose_compare_proposals',
  description:
    'Compare multiple proposals side-by-side. Provides scoring, value comparison, and identifies the strongest proposal across multiple dimensions.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const db = getSupabaseClient();

      const proposalData = await Promise.all(
        input.proposal_ids.map(async (id) => {
          const proposal = await getProposal(db, id);
          const score = scoreProposal(proposal);
          return {
            id: proposal.id,
            title: proposal.title,
            client_name: proposal.client_name,
            status: proposal.status,
            total_amount: proposal.total_amount,
            win_probability: proposal.win_probability,
            score,
            section_count: proposal.sections.filter((s) => s.is_included).length,
            created_at: proposal.created_at,
          };
        }),
      );

      const highestValue = proposalData.reduce((max, p) =>
        (p.total_amount ?? 0) > (max.total_amount ?? 0) ? p : max,
      );
      const bestScore = proposalData.reduce((max, p) =>
        p.score.total > max.score.total ? p : max,
      );
      const mostComplete = proposalData.reduce((max, p) =>
        p.section_count > max.section_count ? p : max,
      );

      const comparison: ProposalComparison = {
        proposals: proposalData,
        summary: {
          highest_value: highestValue.id,
          best_score: bestScore.id,
          most_complete: mostComplete.id,
        },
      };

      return toolResult({
        message: `Compared ${proposalData.length} proposals`,
        comparison,
      });
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to compare proposals');
      return toolError(wrapped.message);
    }
  },
};
