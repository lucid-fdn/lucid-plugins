// ---------------------------------------------------------------------------
// get-csat.ts -- Calculate CSAT score over time period
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { listFeedback } from '../db/feedback-items.js';
import { daysAgo, isoDate } from '../utils/date.js';
import { formatPct } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createGetCsatTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_get_csat',
    description:
      'Calculate the Customer Satisfaction (CSAT) score over a time period. CSAT is the percentage of ratings that are 4 or 5 out of 5.',
    params: {
      days: {
        type: 'number',
        required: false,
        min: 1,
        max: 365,
        description: 'Number of days to look back (default: 30)',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const days = (params.days as number) ?? 30;
        const items = await listFeedback({ limit: 1000 });

        const since = daysAgo(days);
        const filtered = items.filter(
          (i) => i.rating !== null && new Date(i.created_at) >= since,
        );

        if (filtered.length === 0) {
          return 'No rated feedback found in the specified period. Submit feedback with a rating (1-5) to track CSAT.';
        }

        const satisfied = filtered.filter((i) => i.rating! >= 4).length;
        const total = filtered.length;
        const csat = (satisfied / total) * 100;

        // Breakdown by rating
        const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const item of filtered) {
          const r = item.rating!;
          if (r >= 1 && r <= 5) breakdown[r]++;
        }

        const avgRating = filtered.reduce((s, i) => s + i.rating!, 0) / total;

        const lines: string[] = [
          '## CSAT Report',
          '',
          `- **CSAT Score**: ${formatPct(csat)}`,
          `- **Average Rating**: ${avgRating.toFixed(2)}/5`,
          `- **Total Responses**: ${total}`,
          `- **Period**: Last ${days} days (since ${isoDate(since)})`,
          '',
          '### Rating Breakdown',
          `- 5 stars: ${breakdown[5]} (${formatPct((breakdown[5] / total) * 100)})`,
          `- 4 stars: ${breakdown[4]} (${formatPct((breakdown[4] / total) * 100)})`,
          `- 3 stars: ${breakdown[3]} (${formatPct((breakdown[3] / total) * 100)})`,
          `- 2 stars: ${breakdown[2]} (${formatPct((breakdown[2] / total) * 100)})`,
          `- 1 star: ${breakdown[1]} (${formatPct((breakdown[1] / total) * 100)})`,
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_get_csat failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
