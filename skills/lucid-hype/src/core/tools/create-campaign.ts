// ---------------------------------------------------------------------------
// create-campaign.ts -- Create a marketing campaign
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLATFORMS, CAMPAIGN_STATUSES } from '../types/common.js';
import { createCampaign } from '../db/campaigns.js';
import { log } from '../utils/logger.js';

export function createCreateCampaignTool(deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_create_campaign',
    description:
      'Create a new marketing campaign with goals, target platforms, and scheduling. Campaigns group posts and track performance.',
    params: {
      name: { type: 'string', required: true, description: 'Campaign name' },
      description: { type: 'string', required: false, description: 'Campaign description' },
      platforms: {
        type: 'array',
        required: true,
        description: 'Target platforms',
        items: { type: 'enum', values: [...PLATFORMS] },
      },
      goals: {
        type: 'array',
        required: false,
        description: 'Campaign goals (e.g., "increase followers", "drive traffic")',
        items: { type: 'string' },
      },
      status: {
        type: 'enum',
        required: false,
        values: [...CAMPAIGN_STATUSES],
        description: 'Initial status (default: draft)',
      },
      start_date: { type: 'string', required: false, description: 'Start date (ISO)' },
      end_date: { type: 'string', required: false, description: 'End date (ISO)' },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const campaign = await createCampaign({
          name: params.name as string,
          description: (params.description as string) ?? null,
          platforms: params.platforms as any[],
          goals: (params.goals as string[]) ?? [],
          status: (params.status as any) ?? 'draft',
          start_date: (params.start_date as string) ?? null,
          end_date: (params.end_date as string) ?? null,
        });

        const lines = [
          '## Campaign Created',
          '',
          `- **ID**: ${campaign.id}`,
          `- **Name**: ${campaign.name}`,
          `- **Status**: ${campaign.status}`,
          `- **Platforms**: ${campaign.platforms.join(', ')}`,
          `- **Goals**: ${campaign.goals.join(', ') || 'None set'}`,
        ];

        if (campaign.start_date) lines.push(`- **Start**: ${campaign.start_date}`);
        if (campaign.end_date) lines.push(`- **End**: ${campaign.end_date}`);

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_create_campaign failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
