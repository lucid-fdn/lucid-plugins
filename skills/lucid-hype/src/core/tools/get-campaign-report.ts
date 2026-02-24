// ---------------------------------------------------------------------------
// get-campaign-report.ts -- Campaign performance report
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { getCampaignById } from '../db/campaigns.js';
import { listPosts } from '../db/posts.js';
import { calculateViralityScore } from '../analysis/virality-scorer.js';
import { log } from '../utils/logger.js';

export function createGetCampaignReportTool(deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_get_campaign_report',
    description:
      'Generate a comprehensive performance report for a campaign including total engagement, impressions, virality, and recommendations.',
    params: {
      campaign_id: { type: 'string', required: true, description: 'Campaign ID' },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const campaignId = params.campaign_id as string;
        const campaign = await getCampaignById(campaignId);

        if (!campaign) {
          return `Campaign ${campaignId} not found.`;
        }

        const posts = await listPosts({ campaign_id: campaignId, limit: 500 });

        let totalImpressions = 0;
        let totalEngagement = 0;
        let totalVirality = 0;
        const platformCounts = new Map<string, number>();
        let topPost: { url: string; engagement: number } | null = null;

        for (const post of posts) {
          const eng = post.likes + post.shares + post.comments + post.clicks;
          totalImpressions += post.impressions;
          totalEngagement += eng;

          const v = calculateViralityScore({
            impressions: post.impressions,
            likes: post.likes,
            shares: post.shares,
            comments: post.comments,
            clicks: post.clicks,
            hoursLive: 24,
          });
          totalVirality += v.score;

          platformCounts.set(post.platform, (platformCounts.get(post.platform) ?? 0) + eng);

          if (!topPost || eng > topPost.engagement) {
            topPost = { url: post.url ?? post.id, engagement: eng };
          }
        }

        const avgRate =
          totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0;
        const viralityAvg = posts.length > 0 ? totalVirality / posts.length : 0;

        let topPlatform: string | null = null;
        let maxPlatformEng = 0;
        for (const [platform, eng] of platformCounts) {
          if (eng > maxPlatformEng) {
            maxPlatformEng = eng;
            topPlatform = platform;
          }
        }

        const recommendations: string[] = [];
        if (avgRate < 2)
          recommendations.push('Engagement rate is below average. Consider more compelling CTAs.');
        if (posts.length < 5)
          recommendations.push('Increase posting frequency for better data and reach.');
        if (viralityAvg < 30)
          recommendations.push(
            'Virality is low. Try more shareable content formats like threads or videos.',
          );

        const lines = [
          `## Campaign Report: ${campaign.name}`,
          '',
          `- **Status**: ${campaign.status}`,
          `- **Total Posts**: ${posts.length}`,
          `- **Total Impressions**: ${totalImpressions.toLocaleString()}`,
          `- **Total Engagement**: ${totalEngagement.toLocaleString()}`,
          `- **Avg Engagement Rate**: ${avgRate.toFixed(2)}%`,
          `- **Avg Virality Score**: ${viralityAvg.toFixed(1)}/100`,
        ];

        if (topPlatform) lines.push(`- **Top Platform**: ${topPlatform}`);
        if (topPost)
          lines.push(`- **Top Post**: ${topPost.url} (${topPost.engagement} engagements)`);

        if (recommendations.length > 0) {
          lines.push('');
          lines.push('### Recommendations');
          for (const rec of recommendations) {
            lines.push(`- ${rec}`);
          }
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_get_campaign_report failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
