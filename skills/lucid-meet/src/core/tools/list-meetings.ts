// ---------------------------------------------------------------------------
// list-meetings.ts -- List meetings with filters
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import type { MeetingType, MeetingStatus } from '../types/common.js';
import { MEETING_TYPES, MEETING_STATUSES } from '../types/common.js';
import { listMeetings } from '../db/meetings.js';
import { formatDuration } from '../utils/text.js';
import { formatRelative } from '../utils/date.js';
import { log } from '../utils/logger.js';

export function createListMeetingsTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_list_meetings',
    description:
      'List meetings with optional filters by type, status, date range. Returns a formatted list of meetings.',
    params: {
      type: {
        type: 'enum',
        required: false,
        values: [...MEETING_TYPES],
        description: 'Filter by meeting type',
      },
      status: {
        type: 'enum',
        required: false,
        values: [...MEETING_STATUSES],
        description: 'Filter by meeting status',
      },
      since: {
        type: 'string',
        required: false,
        description: 'Filter meetings scheduled after this ISO date',
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 100,
        description: 'Maximum number of meetings to return (default: 20)',
      },
    },
    execute: async (params: {
      type?: string;
      status?: string;
      since?: string;
      limit?: number;
    }): Promise<string> => {
      try {
        const meetings = await listMeetings({
          type: params.type as MeetingType | undefined,
          status: params.status as MeetingStatus | undefined,
          since: params.since,
          limit: params.limit ?? 20,
        });

        if (meetings.length === 0) {
          return 'No meetings found matching the criteria.';
        }

        const lines: string[] = [`## Meetings (${meetings.length})`, ''];

        for (const m of meetings) {
          const duration = m.duration_minutes ? ` (${formatDuration(m.duration_minutes)})` : '';
          const attendees = m.attendees?.length ? ` -- ${m.attendees.length} attendee(s)` : '';
          lines.push(`### #${m.id}: ${m.title}`);
          lines.push(`- **Type**: ${m.type} | **Status**: ${m.status}`);
          lines.push(`- **When**: ${m.scheduled_at} (${formatRelative(m.scheduled_at)})${duration}`);
          if (attendees) lines.push(`- **Attendees**: ${m.attendees.map((a) => a.name).join(', ')}`);
          if (m.sentiment) lines.push(`- **Sentiment**: ${m.sentiment}`);
          lines.push('');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_list_meetings failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
