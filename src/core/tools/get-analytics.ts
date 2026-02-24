import { z } from 'zod';
import type { ToolDefinition } from './types.js';
import { toolResult, toolError } from './types.js';
import { getSupabaseClient } from '../db/client.js';
import { listProposals } from '../db/proposals.js';
import { getProposalEvents, getRecentEvents, computeAnalyticsSummary } from '../db/analytics.js';
import { loadConfig } from '../config/index.js';
import { wrapError } from '../utils/errors.js';

const inputSchema = z.object({
  proposal_id: z.string().optional(),
  days: z.number().int().positive().default(30),
});

export const getAnalyticsTool: ToolDefinition = {
  name: 'propose_get_analytics',
  description:
    'Get analytics data for proposals. If proposal_id is provided, returns events for that specific proposal. Otherwise returns aggregate analytics including win rates, average deal size, and pipeline value.',
  inputSchema,
  handler: async (params) => {
    try {
      const input = inputSchema.parse(params);
      const config = loadConfig();
      const db = getSupabaseClient();

      if (input.proposal_id) {
        const events = await getProposalEvents(db, input.proposal_id);
        return toolResult({
          message: `Found ${events.length} event(s) for proposal`,
          proposal_id: input.proposal_id,
          events,
        });
      }

      const proposals = await listProposals(db, config.tenantId);
      const events = await getRecentEvents(db, config.tenantId, input.days);
      const summary = computeAnalyticsSummary(proposals, events);

      return toolResult({
        message: 'Analytics summary generated',
        period_days: input.days,
        summary,
      });
    } catch (error) {
      const wrapped = wrapError(error, 'Failed to get analytics');
      return toolError(wrapped.message);
    }
  },
};
