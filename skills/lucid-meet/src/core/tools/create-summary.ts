// ---------------------------------------------------------------------------
// create-summary.ts -- Generate structured meeting summary
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { getMeetingById, updateMeeting } from '../db/meetings.js';
import { listActionItems } from '../db/action-items.js';
import { listDecisions } from '../db/decisions.js';
import {
  generateSummary,
  extractKeyTopics,
  analyzeSentiment,
} from '../analysis/transcript-analyzer.js';
import { formatDuration } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createCreateSummaryTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_create_summary',
    description:
      'Generate a structured meeting summary including key topics, decisions, action items, attendees, and sentiment.',
    params: {
      meeting_id: {
        type: 'number',
        required: true,
        description: 'ID of the meeting to summarize',
      },
    },
    execute: async (params: { meeting_id: number }): Promise<string> => {
      try {
        const meeting = await getMeetingById(params.meeting_id);
        if (!meeting) return `Error: Meeting #${params.meeting_id} not found.`;

        const [actions, decisions] = await Promise.all([
          listActionItems({ meeting_id: meeting.id }).catch(() => []),
          listDecisions({ meeting_id: meeting.id }).catch(() => []),
        ]);

        let summary = meeting.summary;
        let topics = meeting.key_topics ?? [];
        let sentiment = meeting.sentiment;

        // Generate analysis from transcript if available
        if (meeting.transcript) {
          if (!summary) summary = generateSummary(meeting.transcript);
          if (topics.length === 0) topics = extractKeyTopics(meeting.transcript);
          if (!sentiment) sentiment = analyzeSentiment(meeting.transcript);

          // Persist back
          await updateMeeting(meeting.id, { summary, key_topics: topics, sentiment }).catch(
            (err) => log.warn('Failed to update meeting summary:', err),
          );
        }

        const lines: string[] = [
          `## Meeting Summary: ${meeting.title}`,
          '',
          `- **Type**: ${meeting.type}`,
          `- **Status**: ${meeting.status}`,
          `- **Date**: ${meeting.scheduled_at}`,
        ];

        if (meeting.duration_minutes) {
          lines.push(`- **Duration**: ${formatDuration(meeting.duration_minutes)}`);
        }

        if (meeting.attendees?.length > 0) {
          lines.push(`- **Attendees**: ${meeting.attendees.map((a) => a.name).join(', ')}`);
        }

        if (sentiment) {
          lines.push(`- **Sentiment**: ${sentiment}`);
        }

        lines.push('');

        if (summary) {
          lines.push('### Summary');
          lines.push(summary);
          lines.push('');
        }

        if (topics.length > 0) {
          lines.push('### Key Topics');
          for (const topic of topics) {
            lines.push(`- ${topic}`);
          }
          lines.push('');
        }

        if (decisions.length > 0) {
          lines.push(`### Decisions (${decisions.length})`);
          for (const d of decisions) {
            lines.push(`- **${d.title}**: ${d.description ?? 'No details'} (by ${d.decided_by})`);
          }
          lines.push('');
        }

        if (actions.length > 0) {
          lines.push(`### Action Items (${actions.length})`);
          for (const a of actions) {
            const due = a.due_date ? ` (due: ${a.due_date})` : '';
            const status = a.status === 'completed' ? '[x]' : '[ ]';
            lines.push(`- ${status} **${a.title}** -- ${a.assignee}${due} [${a.priority}]`);
          }
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_create_summary failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
