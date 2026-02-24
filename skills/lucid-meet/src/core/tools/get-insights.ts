// ---------------------------------------------------------------------------
// get-insights.ts -- Meeting patterns, frequency, productivity insights
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { getRecentMeetings } from '../db/meetings.js';
import { listActionItems } from '../db/action-items.js';
import { listFollowUps } from '../db/follow-ups.js';
import {
  scoreMeetingEffectiveness,
  calculateActionCompletionRate,
  identifyBottlenecks,
  measureFollowUpRate,
} from '../analysis/meeting-scorer.js';
import { formatDuration } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createGetInsightsTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_get_insights',
    description:
      'Get meeting insights including patterns, frequency, productivity metrics, action item completion rates, and bottleneck analysis.',
    params: {
      days: {
        type: 'number',
        required: false,
        min: 1,
        max: 365,
        description: 'Number of days to analyze (default: 30)',
      },
    },
    execute: async (params: { days?: number }): Promise<string> => {
      try {
        const days = params.days ?? 30;

        const [meetings, allActions, allFollowUps] = await Promise.all([
          getRecentMeetings(days).catch(() => []),
          listActionItems({ limit: 500 }).catch(() => []),
          listFollowUps({ limit: 500 }).catch(() => []),
        ]);

        if (meetings.length === 0) {
          return `No meetings found in the last ${days} days.`;
        }

        // Meeting frequency
        const meetingsPerWeek = Math.round((meetings.length / days) * 7 * 10) / 10;

        // Type distribution
        const typeCounts = new Map<string, number>();
        for (const m of meetings) {
          typeCounts.set(m.type, (typeCounts.get(m.type) ?? 0) + 1);
        }

        // Average duration
        const durations = meetings.filter((m) => m.duration_minutes).map((m) => m.duration_minutes!);
        const avgDuration = durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : 0;

        // Average effectiveness score
        const scores = meetings.map((m) => scoreMeetingEffectiveness(m));
        const avgScore = Math.round(
          scores.reduce((sum, s) => sum + s.overall, 0) / scores.length,
        );

        // Action item metrics
        const actionMetrics = calculateActionCompletionRate(allActions);
        const bottlenecks = identifyBottlenecks(allActions);
        const followUpMetrics = measureFollowUpRate(allFollowUps);

        const lines: string[] = [
          `## Meeting Insights (Last ${days} Days)`,
          '',
          '### Overview',
          `- Total meetings: ${meetings.length}`,
          `- Meetings per week: ${meetingsPerWeek}`,
          `- Average duration: ${avgDuration > 0 ? formatDuration(avgDuration) : 'N/A'}`,
          `- Average effectiveness score: ${avgScore}/100`,
          '',
          '### Meeting Types',
        ];

        for (const [type, count] of typeCounts) {
          const pct = Math.round((count / meetings.length) * 100);
          lines.push(`- ${type}: ${count} (${pct}%)`);
        }

        lines.push('');
        lines.push('### Action Items');
        lines.push(`- Total: ${actionMetrics.total}`);
        lines.push(`- Completed: ${actionMetrics.completed} (${Math.round(actionMetrics.completionRate)}%)`);
        lines.push(`- Pending: ${actionMetrics.pending}`);
        lines.push(`- Overdue: ${actionMetrics.overdue}`);
        if (actionMetrics.averageCompletionDays > 0) {
          lines.push(`- Avg completion time: ${Math.round(actionMetrics.averageCompletionDays)} days`);
        }

        if (bottlenecks.length > 0) {
          lines.push('');
          lines.push('### Bottlenecks');
          for (const b of bottlenecks.slice(0, 5)) {
            lines.push(
              `- **${b.assignee}**: ${b.overdueCount} overdue, ${b.pendingCount} pending (oldest: ${b.oldestOverdueDays}d)`,
            );
          }
        }

        lines.push('');
        lines.push('### Follow-Up Metrics');
        lines.push(`- Total: ${followUpMetrics.total}`);
        lines.push(`- Sent: ${followUpMetrics.sent}`);
        lines.push(`- Pending: ${followUpMetrics.pending}`);
        lines.push(`- Follow-up rate: ${Math.round(followUpMetrics.followUpRate)}%`);

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_get_insights failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
