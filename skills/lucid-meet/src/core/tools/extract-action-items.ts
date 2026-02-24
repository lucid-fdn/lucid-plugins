// ---------------------------------------------------------------------------
// extract-action-items.ts -- Extract action items from transcript
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { getMeetingById } from '../db/meetings.js';
import { createActionItem } from '../db/action-items.js';
import { extractActionItems } from '../analysis/transcript-analyzer.js';
import { log } from '../utils/logger.js';

export function createExtractActionItemsTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_extract_action_items',
    description:
      'Extract action items from a meeting transcript with assignees, deadlines, and priority levels. Optionally saves them to the database.',
    params: {
      meeting_id: {
        type: 'number',
        required: false,
        description: 'Meeting ID whose transcript to parse',
      },
      transcript: {
        type: 'string',
        required: false,
        description: 'Raw transcript text (used if meeting_id not provided)',
      },
      save: {
        type: 'boolean',
        required: false,
        description: 'Whether to save extracted items to the database (default: false)',
      },
    },
    execute: async (params: {
      meeting_id?: number;
      transcript?: string;
      save?: boolean;
    }): Promise<string> => {
      try {
        let transcript: string;
        let meetingId: number | undefined;

        if (params.meeting_id) {
          meetingId = params.meeting_id;
          const meeting = await getMeetingById(params.meeting_id);
          if (!meeting) return `Error: Meeting #${params.meeting_id} not found.`;
          if (!meeting.transcript) return `Error: Meeting #${params.meeting_id} has no transcript.`;
          transcript = meeting.transcript;
        } else if (params.transcript) {
          transcript = params.transcript;
        } else {
          return 'Error: Provide either meeting_id or transcript text.';
        }

        const actions = extractActionItems(transcript);

        if (actions.length === 0) {
          return 'No action items found in the transcript.';
        }

        // Optionally save to database
        if (params.save && meetingId) {
          for (const action of actions) {
            await createActionItem({
              meeting_id: meetingId,
              title: action.title,
              assignee: action.assignee,
              priority: action.priority,
              description: action.dueHint ? `Due: ${action.dueHint}` : null,
            }).catch((err) => log.warn('Failed to save action item:', err));
          }
        }

        const lines: string[] = [
          `## Extracted Action Items (${actions.length})`,
          '',
        ];

        for (let i = 0; i < actions.length; i++) {
          const a = actions[i];
          const due = a.dueHint ? ` | Due: ${a.dueHint}` : '';
          lines.push(`${i + 1}. **${a.title}**`);
          lines.push(`   - Assignee: ${a.assignee}`);
          lines.push(`   - Priority: ${a.priority}${due}`);
        }

        if (params.save && meetingId) {
          lines.push('');
          lines.push(`_${actions.length} action item(s) saved to meeting #${meetingId}_`);
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_extract_action_items failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
