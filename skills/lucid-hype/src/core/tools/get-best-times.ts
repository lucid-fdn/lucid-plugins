// ---------------------------------------------------------------------------
// get-best-times.ts -- Best posting times by platform and audience
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLATFORMS, type Platform, type PostingTime } from '../types/common.js';
import { log } from '../utils/logger.js';

/** Default best posting times per platform (based on industry research) */
const DEFAULT_BEST_TIMES: Record<Platform, PostingTime[]> = {
  twitter: [
    { platform: 'twitter', dayOfWeek: 2, hourUtc: 14, avgEngagement: 85 },
    { platform: 'twitter', dayOfWeek: 3, hourUtc: 14, avgEngagement: 82 },
    { platform: 'twitter', dayOfWeek: 4, hourUtc: 15, avgEngagement: 80 },
    { platform: 'twitter', dayOfWeek: 1, hourUtc: 13, avgEngagement: 75 },
  ],
  linkedin: [
    { platform: 'linkedin', dayOfWeek: 2, hourUtc: 10, avgEngagement: 90 },
    { platform: 'linkedin', dayOfWeek: 3, hourUtc: 10, avgEngagement: 88 },
    { platform: 'linkedin', dayOfWeek: 4, hourUtc: 11, avgEngagement: 85 },
    { platform: 'linkedin', dayOfWeek: 1, hourUtc: 10, avgEngagement: 80 },
  ],
  reddit: [
    { platform: 'reddit', dayOfWeek: 1, hourUtc: 14, avgEngagement: 85 },
    { platform: 'reddit', dayOfWeek: 6, hourUtc: 10, avgEngagement: 80 },
    { platform: 'reddit', dayOfWeek: 0, hourUtc: 10, avgEngagement: 78 },
  ],
  tiktok: [
    { platform: 'tiktok', dayOfWeek: 2, hourUtc: 19, avgEngagement: 90 },
    { platform: 'tiktok', dayOfWeek: 4, hourUtc: 19, avgEngagement: 88 },
    { platform: 'tiktok', dayOfWeek: 5, hourUtc: 20, avgEngagement: 85 },
  ],
  youtube: [
    { platform: 'youtube', dayOfWeek: 5, hourUtc: 17, avgEngagement: 88 },
    { platform: 'youtube', dayOfWeek: 6, hourUtc: 14, avgEngagement: 85 },
    { platform: 'youtube', dayOfWeek: 4, hourUtc: 17, avgEngagement: 82 },
  ],
  instagram: [
    { platform: 'instagram', dayOfWeek: 3, hourUtc: 11, avgEngagement: 90 },
    { platform: 'instagram', dayOfWeek: 5, hourUtc: 11, avgEngagement: 87 },
    { platform: 'instagram', dayOfWeek: 2, hourUtc: 14, avgEngagement: 85 },
  ],
  discord: [
    { platform: 'discord', dayOfWeek: 5, hourUtc: 20, avgEngagement: 80 },
    { platform: 'discord', dayOfWeek: 6, hourUtc: 15, avgEngagement: 75 },
  ],
  telegram: [
    { platform: 'telegram', dayOfWeek: 3, hourUtc: 10, avgEngagement: 78 },
    { platform: 'telegram', dayOfWeek: 2, hourUtc: 14, avgEngagement: 75 },
  ],
  hackernews: [
    { platform: 'hackernews', dayOfWeek: 1, hourUtc: 14, avgEngagement: 88 },
    { platform: 'hackernews', dayOfWeek: 2, hourUtc: 15, avgEngagement: 85 },
    { platform: 'hackernews', dayOfWeek: 3, hourUtc: 14, avgEngagement: 82 },
  ],
  producthunt: [
    { platform: 'producthunt', dayOfWeek: 2, hourUtc: 7, avgEngagement: 95 },
    { platform: 'producthunt', dayOfWeek: 3, hourUtc: 7, avgEngagement: 90 },
    { platform: 'producthunt', dayOfWeek: 4, hourUtc: 7, avgEngagement: 88 },
  ],
};

export function createGetBestTimesTool(_deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_get_best_times',
    description:
      'Get best posting times by platform. Returns day-of-week and hour (UTC) with expected engagement scores.',
    params: {
      platform: {
        type: 'enum',
        required: false,
        values: [...PLATFORMS],
        description: 'Specific platform (omit for all platforms)',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const platform = params.platform as Platform | undefined;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const lines = ['## Best Posting Times', ''];

        if (platform) {
          const times = DEFAULT_BEST_TIMES[platform] ?? [];
          lines.push(`### ${platform}`);
          for (const t of times) {
            lines.push(
              `- **${dayNames[t.dayOfWeek]} ${t.hourUtc}:00 UTC** (engagement score: ${t.avgEngagement})`,
            );
          }
        } else {
          for (const p of PLATFORMS) {
            const times = DEFAULT_BEST_TIMES[p] ?? [];
            if (times.length > 0) {
              lines.push(`### ${p}`);
              for (const t of times.slice(0, 2)) {
                lines.push(
                  `- ${dayNames[t.dayOfWeek]} ${t.hourUtc}:00 UTC (score: ${t.avgEngagement})`,
                );
              }
              lines.push('');
            }
          }
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_get_best_times failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
