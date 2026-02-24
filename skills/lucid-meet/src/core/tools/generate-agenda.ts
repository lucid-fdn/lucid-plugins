// ---------------------------------------------------------------------------
// generate-agenda.ts -- Generate meeting agenda from context
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import type { MeetingType } from '../types/common.js';
import { MEETING_TYPES } from '../types/common.js';
import { getRecentMeetings } from '../db/meetings.js';
import { listActionItems } from '../db/action-items.js';
import { buildAgenda, suggestTopics, estimateDuration } from '../analysis/agenda-builder.js';
import { formatDuration } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createGenerateAgendaTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_generate_agenda',
    description:
      'Generate a meeting agenda based on meeting type, participants, and context from previous meetings and pending action items.',
    params: {
      type: {
        type: 'enum',
        required: true,
        values: [...MEETING_TYPES],
        description: 'Type of meeting to generate agenda for',
      },
      participants: {
        type: 'array',
        required: false,
        items: { type: 'string' },
        description: 'List of participant names',
      },
      include_carryover: {
        type: 'boolean',
        required: false,
        description: 'Include pending action items from recent meetings (default: true)',
      },
    },
    execute: async (params: {
      type: string;
      participants?: string[];
      include_carryover?: boolean;
    }): Promise<string> => {
      try {
        const meetingType = params.type as MeetingType;
        const includeCarryover = params.include_carryover !== false;

        let previousActions: import('../types/database.js').ActionItem[] = [];
        if (includeCarryover) {
          previousActions = await listActionItems({
            status: 'pending',
            limit: 20,
          }).catch(() => []);
        }

        const agenda = buildAgenda(meetingType, params.participants ?? [], previousActions);

        const recentMeetings = await getRecentMeetings(14).catch(() => []);
        const suggestedTopics = suggestTopics(recentMeetings);
        const totalDuration = estimateDuration(agenda.items);

        const lines: string[] = [
          `## ${agenda.title}`,
          '',
          `- **Type**: ${agenda.type}`,
          `- **Estimated Duration**: ${formatDuration(totalDuration)}`,
        ];

        if (params.participants?.length) {
          lines.push(`- **Participants**: ${params.participants.join(', ')}`);
        }

        lines.push('');
        lines.push('### Agenda');

        let cumulative = 0;
        for (const item of agenda.items) {
          cumulative += item.duration_minutes;
          lines.push(
            `${cumulative - item.duration_minutes}-${cumulative} min | **${item.title}** (${formatDuration(item.duration_minutes)})`,
          );
          if (item.description) {
            lines.push(`  ${item.description}`);
          }
        }

        if (suggestedTopics.length > 0) {
          lines.push('');
          lines.push('### Suggested Discussion Topics');
          for (const topic of suggestedTopics.slice(0, 5)) {
            lines.push(`- ${topic}`);
          }
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_generate_agenda failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
