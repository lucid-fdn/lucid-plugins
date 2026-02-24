// ---------------------------------------------------------------------------
// find-influencers.ts -- Find relevant influencers by niche/platform
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLATFORMS } from '../types/common.js';
import { listInfluencers } from '../db/influencers.js';
import { log } from '../utils/logger.js';

export function createFindInfluencersTool(deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_find_influencers',
    description:
      'Find relevant influencers by platform, niche, and minimum follower count from the tracked influencer database.',
    params: {
      platform: {
        type: 'enum',
        required: false,
        values: [...PLATFORMS],
        description: 'Filter by platform',
      },
      niche: { type: 'string', required: false, description: 'Filter by niche/topic' },
      min_followers: {
        type: 'number',
        required: false,
        description: 'Minimum follower count',
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
        const influencers = await listInfluencers({
          platform: params.platform as any,
          niche: params.niche as string,
          minFollowers: params.min_followers as number,
          limit: (params.limit as number) ?? 20,
        });

        if (influencers.length === 0) {
          return 'No influencers found matching the criteria. Add influencers to track them.';
        }

        const lines = [`## Influencers Found: ${influencers.length}`, ''];

        for (const inf of influencers) {
          lines.push(`### @${inf.handle} (${inf.name})`);
          lines.push(`- **Platform**: ${inf.platform}`);
          lines.push(`- **Followers**: ${inf.followers.toLocaleString()}`);
          lines.push(`- **Engagement Rate**: ${inf.engagement_rate.toFixed(2)}%`);
          lines.push(`- **Niche**: ${inf.niche.join(', ')}`);
          lines.push(
            `- **Audience Quality**: ${((inf.audience_quality ?? 0) * 100).toFixed(0)}%`,
          );
          lines.push(`- **Relevance**: ${((inf.relevance_score ?? 0) * 100).toFixed(0)}%`);
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_find_influencers failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
