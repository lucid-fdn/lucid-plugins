// ---------------------------------------------------------------------------
// list-campaigns.ts -- List campaigns with filters
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { CAMPAIGN_STATUSES, PLATFORMS } from '../types/common.js';
import { listCampaigns } from '../db/campaigns.js';
import { log } from '../utils/logger.js';

export function createListCampaignsTool(deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_list_campaigns',
    description: 'List campaigns with optional filters for status and platform.',
    params: {
      status: {
        type: 'enum',
        required: false,
        values: [...CAMPAIGN_STATUSES],
        description: 'Filter by campaign status',
      },
      platform: {
        type: 'enum',
        required: false,
        values: [...PLATFORMS],
        description: 'Filter by platform',
      },
      limit: {
        type: 'number',
        required: false,
        description: 'Max results (default: 20)',
        default: 20,
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const campaigns = await listCampaigns({
          status: params.status as any,
          platform: params.platform as any,
          limit: (params.limit as number) ?? 20,
        });

        if (campaigns.length === 0) {
          return 'No campaigns found. Create one with hype_create_campaign.';
        }

        const lines = [`## Campaigns (${campaigns.length})`, ''];

        for (const c of campaigns) {
          lines.push(`### ${c.name}`);
          lines.push(`- **ID**: ${c.id}`);
          lines.push(`- **Status**: ${c.status}`);
          lines.push(`- **Platforms**: ${c.platforms.join(', ')}`);
          if (c.description) lines.push(`- **Description**: ${c.description}`);
          lines.push(`- **Created**: ${c.created_at}`);
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_list_campaigns failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
