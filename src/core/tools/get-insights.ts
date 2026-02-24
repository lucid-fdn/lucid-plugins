// ---------------------------------------------------------------------------
// get-insights.ts -- AI-ready structured insights from feedback corpus
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { listFeedback, getFeedbackWithNps } from '../db/feedback-items.js';
import { calculateNps, detectTrends } from '../analysis/trend-detector.js';
import { extractThemes } from '../analysis/sentiment-analyzer.js';
import { extractFeatureRequests } from '../analysis/categorizer.js';
import { buildInsightsSummary } from '../analysis/prompts.js';
import { log } from '../utils/logger.js';

export function createGetInsightsTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_get_insights',
    description:
      'Generate AI-ready structured insights from the entire feedback corpus. Combines NPS, themes, trends, and feature requests into a comprehensive summary.',
    params: {
      days: {
        type: 'number',
        required: false,
        min: 7,
        max: 365,
        description: 'Number of days to analyze (default: 30)',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const days = (params.days as number) ?? 30;

        const [items, npsItems] = await Promise.all([
          listFeedback({ limit: 1000 }),
          getFeedbackWithNps(days),
        ]);

        if (items.length === 0) {
          return 'No feedback data available for insights. Submit feedback first.';
        }

        // NPS
        const nps =
          npsItems.length > 0
            ? calculateNps(npsItems.map((i) => i.nps_score!))
            : null;

        // Themes
        const themes = extractThemes(items);

        // Feature requests
        const featureRequests = extractFeatureRequests(items);

        // Trends
        const trends = detectTrends(items, 7);

        const summary = buildInsightsSummary(trends, themes, featureRequests, nps);

        const lines: string[] = [
          `## Feedback Insights (Last ${days} days)`,
          '',
          `- **Total Feedback Items**: ${items.length}`,
          `- **Items with NPS**: ${npsItems.length}`,
          `- **Feature Requests**: ${featureRequests.length}`,
          `- **Themes Detected**: ${themes.length}`,
          `- **Trend Periods**: ${trends.length}`,
          '',
          '---',
          '',
          summary,
        ];

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_get_insights failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
