// ---------------------------------------------------------------------------
// get-nps.ts -- Calculate NPS score with breakdown
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { getFeedbackWithNps } from '../db/feedback-items.js';
import { calculateNps } from '../analysis/trend-detector.js';
import { extractThemes } from '../analysis/sentiment-analyzer.js';
import { buildNpsReportPrompt } from '../analysis/prompts.js';
import { formatPct } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createGetNpsTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_get_nps',
    description:
      'Calculate the Net Promoter Score (NPS) with breakdown of promoters, passives, and detractors. Optionally filter by time period.',
    params: {
      days: {
        type: 'number',
        required: false,
        min: 1,
        max: 365,
        description: 'Number of days to look back (default: all time)',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const days = params.days as number | undefined;
        const items = await getFeedbackWithNps(days);

        if (items.length === 0) {
          return 'No NPS data found. Submit feedback with nps_score to track NPS.';
        }

        const scores = items.map((i) => i.nps_score!);
        const nps = calculateNps(scores);
        const themes = extractThemes(items);

        const lines: string[] = [
          '## NPS Report',
          '',
          `- **NPS Score**: ${nps.nps}`,
          `- **Total Responses**: ${nps.total}`,
          `- **Promoters** (9-10): ${nps.promoters} (${formatPct(nps.promoter_pct)})`,
          `- **Passives** (7-8): ${nps.passives} (${formatPct(nps.passive_pct)})`,
          `- **Detractors** (0-6): ${nps.detractors} (${formatPct(nps.detractor_pct)})`,
        ];

        if (days) {
          lines.push(`- **Period**: Last ${days} days`);
        }

        if (themes.length > 0) {
          lines.push('', '### Top Themes');
          for (const theme of themes.slice(0, 5)) {
            lines.push(
              `- **${theme.name}**: ${theme.count} mentions (avg sentiment: ${theme.sentiment_avg.toFixed(2)})`,
            );
          }
        }

        lines.push('', '---', '', buildNpsReportPrompt(nps, themes));

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_get_nps failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
