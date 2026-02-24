// ---------------------------------------------------------------------------
// track-post.ts -- Track a social media post's performance
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLATFORMS, CONTENT_TYPES } from '../types/common.js';
import { createPost } from '../db/posts.js';
import { scoreToLevel } from '../analysis/virality-scorer.js';
import { log } from '../utils/logger.js';

export function createTrackPostTool(deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_track_post',
    description:
      'Track a social media post by recording its URL, platform, content, and initial metrics.',
    params: {
      platform: {
        type: 'enum',
        required: true,
        values: [...PLATFORMS],
        description: 'Social media platform',
      },
      url: { type: 'string', required: false, description: 'Post URL' },
      title: { type: 'string', required: false, description: 'Post title' },
      body: { type: 'string', required: false, description: 'Post body/content' },
      content_type: {
        type: 'enum',
        required: false,
        values: [...CONTENT_TYPES],
        description: 'Content type (default: post)',
      },
      campaign_id: { type: 'string', required: false, description: 'Campaign ID to associate' },
      impressions: { type: 'number', required: false, description: 'Current impressions' },
      likes: { type: 'number', required: false, description: 'Current likes' },
      shares: { type: 'number', required: false, description: 'Current shares/retweets' },
      comments: { type: 'number', required: false, description: 'Current comments' },
      clicks: { type: 'number', required: false, description: 'Current clicks' },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const engagement =
          ((params.likes as number) ?? 0) +
          ((params.shares as number) ?? 0) +
          ((params.comments as number) ?? 0) +
          ((params.clicks as number) ?? 0);
        const impressions = (params.impressions as number) ?? 0;
        const rate = impressions > 0 ? (engagement / impressions) * 100 : 0;
        const level = scoreToLevel(Math.min(100, rate * 10));

        const post = await createPost({
          platform: params.platform as any,
          content_type: (params.content_type as any) ?? 'post',
          url: (params.url as string) ?? null,
          title: (params.title as string) ?? null,
          body: (params.body as string) ?? null,
          campaign_id: (params.campaign_id as string) ?? null,
          impressions,
          likes: (params.likes as number) ?? 0,
          shares: (params.shares as number) ?? 0,
          comments: (params.comments as number) ?? 0,
          clicks: (params.clicks as number) ?? 0,
          engagement_level: level,
        });

        const lines = [
          '## Post Tracked',
          '',
          `- **ID**: ${post.id}`,
          `- **Platform**: ${post.platform}`,
          `- **Type**: ${post.content_type}`,
          `- **Engagement Level**: ${post.engagement_level}`,
          `- **Total Engagement**: ${engagement}`,
          `- **Engagement Rate**: ${rate.toFixed(2)}%`,
        ];

        if (post.url) lines.push(`- **URL**: ${post.url}`);
        if (post.campaign_id) lines.push(`- **Campaign**: ${post.campaign_id}`);

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_track_post failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
