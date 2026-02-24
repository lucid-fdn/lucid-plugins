import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { SECTION_TYPES } from '../types/common.js';
import { getSupabaseClient } from '../db/client.js';
import { getProposal } from '../db/proposals.js';
import { buildProposalPrompt } from '../analysis/prompts.js';
import { loadConfig } from '../config/index.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({
  proposal_id: z.string().min(1, 'Proposal ID is required'),
  section_type: z.enum(SECTION_TYPES),
  context: z.string().optional(),
});

export const generateSectionTool: ToolDefinition = {
  name: 'propose_generate_section',
  description:
    'Generate an AI-ready prompt for a specific proposal section. Returns a detailed prompt that can be used to generate section content, incorporating the proposal context and company information.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const config = loadConfig();
      const db = getSupabaseClient();

      const proposal = await getProposal(db, input.proposal_id);

      const prompt = buildProposalPrompt(input.section_type, {
        clientName: proposal.client_name,
        companyName: config.companyName,
        projectTitle: proposal.title,
        additionalContext: input.context,
      });

      return toolResult({
        message: `Section prompt generated for "${input.section_type}"`,
        section_type: input.section_type,
        prompt,
        proposal_context: {
          title: proposal.title,
          client_name: proposal.client_name,
          pricing_model: proposal.pricing_model,
          existing_sections: proposal.sections.map((s) => s.section_type),
        },
      });
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to generate section prompt');
      return toolError(wrapped.message);
    }
  },
};
