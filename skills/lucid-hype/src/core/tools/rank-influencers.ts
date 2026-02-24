// ---------------------------------------------------------------------------
// rank-influencers.ts -- Rank influencers by engagement quality
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import type { InfluencerProfile } from '../types/index.js';
import { rankInfluencers } from '../analysis/influencer-ranker.js';
import { log } from '../utils/logger.js';
import { formatNumber } from '../utils/text.js';

export function createRankInfluencersTool(_deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_rank_influencers',
    description:
      'Rank a list of influencers by composite score based on engagement rate, audience quality, relevance, follower count, and post frequency.',
    params: {
      influencers: {
        type: 'array',
        required: true,
        description: 'Array of influencer profiles to rank',
        items: {
          type: 'object',
          properties: {
            handle: { type: 'string', required: true },
            name: { type: 'string', required: true },
            platform: { type: 'string', required: true },
            followers: { type: 'number', required: true },
            engagementRate: { type: 'number', required: true },
            niche: { type: 'array', required: false, items: { type: 'string' } },
            relevanceScore: { type: 'number', required: false },
            audienceQuality: { type: 'number', required: false },
            avgLikes: { type: 'number', required: false },
            avgComments: { type: 'number', required: false },
            postFrequency: { type: 'number', required: false },
          },
        },
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const rawInfluencers = params.influencers as Record<string, unknown>[];
        const profiles: InfluencerProfile[] = rawInfluencers.map((r) => ({
          handle: (r.handle as string) ?? '',
          name: (r.name as string) ?? '',
          platform: (r.platform as any) ?? 'twitter',
          followers: (r.followers as number) ?? 0,
          engagementRate: (r.engagementRate as number) ?? 0,
          niche: (r.niche as string[]) ?? [],
          relevanceScore: (r.relevanceScore as number) ?? 0.5,
          audienceQuality: (r.audienceQuality as number) ?? 0.5,
          avgLikes: (r.avgLikes as number) ?? 0,
          avgComments: (r.avgComments as number) ?? 0,
          postFrequency: (r.postFrequency as number) ?? 5,
        }));

        const ranked = rankInfluencers(profiles);

        const lines = [`## Influencer Rankings`, ''];

        for (const inf of ranked) {
          lines.push(
            `### #${inf.rank} @${inf.handle} -- Score: ${inf.compositeScore}/100`,
          );
          lines.push(`- **Name**: ${inf.name}`);
          lines.push(`- **Platform**: ${inf.platform}`);
          lines.push(`- **Followers**: ${formatNumber(inf.followers)}`);
          lines.push(`- **Engagement Rate**: ${inf.engagementRate.toFixed(2)}%`);
          lines.push(`- **Expected Reach**: ${formatNumber(inf.expectedReach)}`);
          lines.push(
            `- **Audience Quality**: ${(inf.audienceQuality * 100).toFixed(0)}%`,
          );
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_rank_influencers failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
