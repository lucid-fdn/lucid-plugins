// ---------------------------------------------------------------------------
// get-trends.ts -- Trend analysis of feedback over time
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { listFeedback } from '../db/feedback-items.js';
import { detectTrends, findAnomalies } from '../analysis/trend-detector.js';
import { daysAgo } from '../utils/date.js';
import { log } from '../utils/logger.js';

export function createGetTrendsTool(_deps: { config: PluginConfig }): ToolDefinition {
  return {
    name: 'feedback_get_trends',
    description:
      'Analyze feedback trends over time. Detects volume changes, sentiment shifts, and anomalies. Groups data by day, week, or month.',
    params: {
      days: {
        type: 'number',
        required: false,
        min: 7,
        max: 365,
        description: 'Number of days to analyze (default: 30)',
      },
      period: {
        type: 'enum',
        required: false,
        values: ['day', 'week', 'month'],
        description: 'Grouping period (default: week)',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const days = (params.days as number) ?? 30;
        const period = (params.period as string) ?? 'week';
        const periodDays = period === 'day' ? 1 : period === 'week' ? 7 : 30;

        const items = await listFeedback({ limit: 1000 });
        const since = daysAgo(days);
        const filtered = items.filter((i) => new Date(i.created_at) >= since);

        if (filtered.length === 0) {
          return `No feedback found in the last ${days} days.`;
        }

        const trends = detectTrends(filtered, periodDays);

        if (trends.length === 0) {
          return `Not enough data to detect trends over ${days} days.`;
        }

        // Detect anomalies
        const latest = trends[trends.length - 1];
        const historical = trends.slice(0, -1);
        const anomalies = findAnomalies(
          {
            volume: latest.volume,
            sentiment_avg: latest.sentiment_avg,
            nps_score: latest.nps_score,
          },
          historical.map((t) => ({
            volume: t.volume,
            sentiment_avg: t.sentiment_avg,
            nps_score: t.nps_score,
          })),
        );

        const lines: string[] = [
          `## Feedback Trends (Last ${days} days, grouped by ${period})`,
          '',
        ];

        for (const trend of trends) {
          const changeStr =
            trend.change_pct !== null
              ? ` (${trend.change_pct > 0 ? '+' : ''}${trend.change_pct}%)`
              : '';
          lines.push(`### ${trend.period}`);
          lines.push(`- Volume: ${trend.volume}${changeStr}`);
          lines.push(`- Sentiment: ${trend.sentiment_avg}`);
          if (trend.nps_score !== null) lines.push(`- NPS: ${trend.nps_score}`);
          if (trend.top_themes.length > 0) lines.push(`- Themes: ${trend.top_themes.join(', ')}`);
          lines.push('');
        }

        if (anomalies.length > 0) {
          lines.push('### Anomalies Detected');
          for (const anomaly of anomalies) {
            lines.push(
              `- **[${anomaly.severity.toUpperCase()}]** ${anomaly.description}`,
            );
          }
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('feedback_get_trends failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
