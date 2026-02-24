// ---------------------------------------------------------------------------
// analyze-engagement.ts -- Engagement analysis for a post or campaign
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLATFORMS } from '../types/common.js';
import { analyzeEngagement, type PostData } from '../analysis/engagement-analyzer.js';
import { log } from '../utils/logger.js';

export function createAnalyzeEngagementTool(_deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_analyze_engagement',
    description:
      'Analyze engagement patterns for a set of posts. Returns best posting times, audience segments, sentiment analysis, and top content types.',
    params: {
      posts: {
        type: 'array',
        required: true,
        description: 'Array of post data objects with metrics',
        items: {
          type: 'object',
          properties: {
            platform: { type: 'enum', required: true, values: [...PLATFORMS] },
            contentType: { type: 'string', required: false },
            impressions: { type: 'number', required: true },
            likes: { type: 'number', required: true },
            shares: { type: 'number', required: true },
            comments: { type: 'number', required: true },
            clicks: { type: 'number', required: false },
            postedAt: { type: 'string', required: true },
          },
        },
      },
      platform: {
        type: 'enum',
        required: false,
        values: [...PLATFORMS],
        description: 'Filter by platform',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const rawPosts = params.posts as Record<string, unknown>[];
        const posts: PostData[] = rawPosts.map((p) => ({
          platform: (p.platform as any) ?? 'twitter',
          contentType: (p.contentType as any) ?? 'post',
          impressions: (p.impressions as number) ?? 0,
          likes: (p.likes as number) ?? 0,
          shares: (p.shares as number) ?? 0,
          comments: (p.comments as number) ?? 0,
          clicks: (p.clicks as number) ?? 0,
          postedAt: (p.postedAt as string) ?? new Date().toISOString(),
        }));

        const analysis = analyzeEngagement({
          posts,
          platform: params.platform as any,
        });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const lines = [
          '## Engagement Analysis',
          '',
          `- **Total Engagement**: ${analysis.totalEngagement.toLocaleString()}`,
          `- **Engagement Rate**: ${analysis.engagementRate.toFixed(2)}%`,
          '',
        ];

        if (analysis.bestPostingTimes.length > 0) {
          lines.push('### Best Posting Times');
          for (const t of analysis.bestPostingTimes.slice(0, 5)) {
            lines.push(
              `- ${dayNames[t.dayOfWeek]} ${t.hourUtc}:00 UTC on ${t.platform} (avg: ${t.avgEngagement.toFixed(0)})`,
            );
          }
          lines.push('');
        }

        if (analysis.topContentTypes.length > 0) {
          lines.push('### Top Content Types');
          for (const ct of analysis.topContentTypes) {
            lines.push(
              `- **${ct.contentType}**: avg ${ct.avgEngagement.toFixed(0)} engagement (${ct.count} posts)`,
            );
          }
          lines.push('');
        }

        lines.push('### Sentiment');
        lines.push(
          `- Positive: ${(analysis.sentimentBreakdown.positive * 100).toFixed(0)}%`,
        );
        lines.push(
          `- Neutral: ${(analysis.sentimentBreakdown.neutral * 100).toFixed(0)}%`,
        );
        lines.push(
          `- Negative: ${(analysis.sentimentBreakdown.negative * 100).toFixed(0)}%`,
        );

        if (analysis.audienceSegments.length > 0) {
          lines.push('');
          lines.push('### Audience Segments');
          for (const seg of analysis.audienceSegments) {
            lines.push(
              `- **${seg.name}**: ${seg.percentage.toFixed(0)}% (${seg.engagementRate.toFixed(2)}% rate)`,
            );
          }
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_analyze_engagement failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
