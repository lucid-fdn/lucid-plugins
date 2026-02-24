// ---------------------------------------------------------------------------
// create-meeting.ts -- Create / record a meeting entry
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import type { MeetingType, MeetingStatus } from '../types/common.js';
import { MEETING_TYPES, MEETING_STATUSES } from '../types/common.js';
import { createMeeting } from '../db/meetings.js';
import { isoNow } from '../utils/date.js';
import { log } from '../utils/logger.js';

export function createCreateMeetingTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_create_meeting',
    description:
      'Create a new meeting entry in the system. Provide title, type, date, attendees, and optionally transcript/recording URL.',
    params: {
      title: {
        type: 'string',
        required: true,
        description: 'Meeting title',
      },
      type: {
        type: 'enum',
        required: true,
        values: [...MEETING_TYPES],
        description: 'Type of meeting',
      },
      scheduled_at: {
        type: 'string',
        required: false,
        description: 'ISO date when the meeting is scheduled (defaults to now)',
      },
      status: {
        type: 'enum',
        required: false,
        values: [...MEETING_STATUSES],
        description: 'Meeting status (default: scheduled)',
      },
      attendees: {
        type: 'array',
        required: false,
        items: { type: 'string' },
        description: 'List of attendee names',
      },
      transcript: {
        type: 'string',
        required: false,
        description: 'Meeting transcript text',
      },
      recording_url: {
        type: 'string',
        required: false,
        description: 'URL to meeting recording',
      },
      duration_minutes: {
        type: 'number',
        required: false,
        description: 'Duration in minutes',
      },
    },
    execute: async (params: {
      title: string;
      type: string;
      scheduled_at?: string;
      status?: string;
      attendees?: string[];
      transcript?: string;
      recording_url?: string;
      duration_minutes?: number;
    }): Promise<string> => {
      try {
        const meeting = await createMeeting({
          title: params.title,
          type: params.type as MeetingType,
          scheduled_at: params.scheduled_at ?? isoNow(),
          status: (params.status as MeetingStatus) ?? 'scheduled',
          attendees: params.attendees?.map((name) => ({ name })) ?? [],
          transcript: params.transcript ?? null,
          recording_url: params.recording_url ?? null,
          duration_minutes: params.duration_minutes ?? null,
        });

        const lines: string[] = [
          '## Meeting Created',
          '',
          `- **ID**: ${meeting.id}`,
          `- **Title**: ${meeting.title}`,
          `- **Type**: ${meeting.type}`,
          `- **Status**: ${meeting.status}`,
          `- **Scheduled**: ${meeting.scheduled_at}`,
        ];

        if (meeting.attendees?.length > 0) {
          lines.push(`- **Attendees**: ${meeting.attendees.map((a) => a.name).join(', ')}`);
        }
        if (meeting.duration_minutes) {
          lines.push(`- **Duration**: ${meeting.duration_minutes} min`);
        }
        if (meeting.transcript) {
          lines.push(`- **Transcript**: Provided (${meeting.transcript.length} chars)`);
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_create_meeting failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
