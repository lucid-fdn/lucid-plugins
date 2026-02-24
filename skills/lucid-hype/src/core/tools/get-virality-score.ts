// ---------------------------------------------------------------------------
// get-virality-score.ts -- Calculate virality score for content
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { calculateViralityScore } from '../analysis/virality-scorer.js';
import { log } from '../utils/logger.js';

export function createGetViralityScoreTool(_deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_get_virality_score',
    description:
      'Calculate a virality score (0-100) for content based on engagement velocity, share ratio, comment depth, and amplification.',
    params: {
      impressions: { type: 'number', required: true, description: 'Total impressions' },
      likes: { type: 'number', required: true, description: 'Total likes' },
      shares: { type: 'number', required: true, description: 'Total shares/retweets' },
      comments: { type: 'number', required: true, description: 'Total comments' },
      clicks: { type: 'number', required: false, description: 'Total clicks', default: 0 },
      hours_live: {
        type: 'number',
        required: true,
        description: 'Hours since post was published',
      },
      reply_depth_avg: {
        type: 'number',
        required: false,
        description: 'Average reply thread depth',
        default: 0,
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const result = calculateViralityScore({
          impressions: params.impressions as number,
          likes: params.likes as number,
          shares: params.shares as number,
          comments: params.comments as number,
          clicks: (params.clicks as number) ?? 0,
          hoursLive: params.hours_live as number,
          replyDepthAvg: (params.reply_depth_avg as number) ?? 0,
        });

        const lines = [
          `## Virality Score: ${result.score}/100 (${result.level.toUpperCase()})`,
          '',
          `- **Velocity**: ${result.velocity.toFixed(1)} engagements/hour`,
          `- **Share Ratio**: ${(result.shareRatio * 100).toFixed(1)}%`,
          `- **Comment Depth**: ${result.commentDepth.toFixed(1)}`,
          '',
          '### Factor Breakdown',
        ];

        for (const factor of result.factors) {
          lines.push(
            `- **${factor.name}** (${(factor.weight * 100).toFixed(0)}%): ${factor.value.toFixed(0)}/100 -- ${factor.description}`,
          );
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_get_virality_score failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
