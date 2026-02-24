import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { PRICING_MODELS } from '../types/common.js';
import { getSupabaseClient } from '../db/client.js';
import { createProposal } from '../db/proposals.js';
import { getTemplate } from '../db/templates.js';
import { recordEvent } from '../db/analytics.js';
import { loadConfig } from '../config/index.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  client_name: z.string().min(1, 'Client name is required'),
  client_email: z.string().email('Valid email is required'),
  pricing_model: z.enum(PRICING_MODELS),
  template_id: z.string().optional(),
});

export const createProposalTool: ToolDefinition = {
  name: 'propose_create_proposal',
  description:
    'Create a new proposal. Optionally use a template to pre-populate sections. Returns the created proposal with its ID.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const config = loadConfig();
      const db = getSupabaseClient();

      let sections = undefined;
      if (input.template_id) {
        const template = await getTemplate(db, input.template_id);
        sections = template.sections;
      }

      const proposal = await createProposal(db, {
        tenant_id: config.tenantId,
        title: input.title,
        client_name: input.client_name,
        client_email: input.client_email,
        pricing_model: input.pricing_model,
        template_id: input.template_id,
        sections,
        currency: config.defaultCurrency,
        expiry_days: config.expiryDays,
      });

      await recordEvent(db, proposal.id, 'created', {
        template_id: input.template_id ?? null,
      });

      return toolResult({
        message: `Proposal "${proposal.title}" created successfully`,
        proposal,
      });
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to create proposal');
      return toolError(wrapped.message);
    }
  },
};
