// ---------------------------------------------------------------------------
// get-content-calendar.ts -- Content calendar suggestions
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLATFORMS, CONTENT_TYPES, type Platform, type ContentType } from '../types/common.js';
import { recommendContentType } from '../analysis/content-optimizer.js';
import { log } from '../utils/logger.js';

export function createGetContentCalendarTool(deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_get_content_calendar',
    description:
      'Generate a content calendar with suggested topics, platforms, content types, and posting times for the next 7 days.',
    params: {
      platforms: {
        type: 'array',
        required: true,
        description: 'Target platforms',
        items: { type: 'enum', values: [...PLATFORMS] },
      },
      topics: {
        type: 'array',
        required: false,
        description: 'Key topics/themes to cover',
        items: { type: 'string' },
      },
      posts_per_day: {
        type: 'number',
        required: false,
        description: 'Posts per day (default: 2)',
        default: 2,
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const platforms = params.platforms as Platform[];
        const topics = (params.topics as string[]) ?? [
          'Product update',
          'Industry insight',
          'Behind the scenes',
          'Customer story',
          'Tips & tricks',
          'Thought leadership',
          'Community engagement',
        ];
        const postsPerDay = (params.posts_per_day as number) ?? 2;

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const now = new Date();

        const lines = ['## Content Calendar (Next 7 Days)', ''];

        for (let d = 0; d < 7; d++) {
          const date = new Date(now);
          date.setDate(date.getDate() + d);
          const dateStr = date.toISOString().split('T')[0];
          const dayName = dayNames[date.getDay()];

          lines.push(`### ${dayName}, ${dateStr}`);

          for (let p = 0; p < postsPerDay && p < platforms.length; p++) {
            const platform = platforms[p % platforms.length];
            const topic = topics[(d * postsPerDay + p) % topics.length];
            const contentType = recommendContentType(platform);

            lines.push(`- **${platform}** (${contentType}): ${topic}`);
          }
          lines.push('');
        }

        lines.push('### Tips');
        lines.push('- Mix content types for variety');
        lines.push('- Post at optimal times for each platform');
        lines.push('- Engage with comments within the first hour');
        lines.push('- Repurpose top-performing content across platforms');

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_get_content_calendar failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
