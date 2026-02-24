// ---------------------------------------------------------------------------
// track-followup.ts -- Track follow-up items and completion
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { createFollowUp, listFollowUps, updateFollowUp } from '../db/follow-ups.js';
import { isoNow } from '../utils/date.js';
import { log } from '../utils/logger.js';

export function createTrackFollowUpTool(_deps: {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}): ToolDefinition {
  return {
    name: 'meet_track_followup',
    description:
      'Track follow-up items and their completion status. Create new follow-ups, list pending ones, or mark them complete.',
    params: {
      action: {
        type: 'enum',
        required: true,
        values: ['create', 'list', 'complete'],
        description: 'Action to perform: create, list, or complete a follow-up',
      },
      follow_up_id: {
        type: 'number',
        required: false,
        description: 'Follow-up ID (required for complete action)',
      },
      meeting_id: {
        type: 'number',
        required: false,
        description: 'Filter by meeting ID (for list action)',
      },
      recipient: {
        type: 'string',
        required: false,
        description: 'Recipient name/email (required for create action)',
      },
      message: {
        type: 'string',
        required: false,
        description: 'Follow-up message (required for create action)',
      },
      scheduled_for: {
        type: 'string',
        required: false,
        description: 'ISO date for when to send follow-up (for create action)',
      },
    },
    execute: async (params: {
      action: string;
      follow_up_id?: number;
      meeting_id?: number;
      recipient?: string;
      message?: string;
      scheduled_for?: string;
    }): Promise<string> => {
      try {
        switch (params.action) {
          case 'create': {
            if (!params.recipient) return 'Error: recipient is required for create action.';
            if (!params.message) return 'Error: message is required for create action.';

            const followUp = await createFollowUp({
              meeting_id: params.meeting_id ?? null,
              recipient: params.recipient,
              message: params.message,
              scheduled_for: params.scheduled_for ?? isoNow(),
            });

            return [
              '## Follow-Up Created',
              '',
              `- **ID**: ${followUp.id}`,
              `- **Recipient**: ${followUp.recipient}`,
              `- **Scheduled**: ${followUp.scheduled_for}`,
              `- **Status**: ${followUp.status}`,
              '',
              `> ${followUp.message}`,
            ].join('\n');
          }

          case 'list': {
            const followUps = await listFollowUps({
              meeting_id: params.meeting_id,
              limit: 50,
            });

            if (followUps.length === 0) {
              return 'No follow-ups found.';
            }

            const lines: string[] = [`## Follow-Ups (${followUps.length})`, ''];
            for (const f of followUps) {
              const icon = f.status === 'sent' ? '[x]' : f.status === 'failed' ? '[!]' : '[ ]';
              lines.push(`${icon} **#${f.id}** to ${f.recipient} -- ${f.status}`);
              lines.push(`  Scheduled: ${f.scheduled_for}`);
              if (f.sent_at) lines.push(`  Sent: ${f.sent_at}`);
            }

            return lines.join('\n');
          }

          case 'complete': {
            if (!params.follow_up_id) return 'Error: follow_up_id is required for complete action.';

            const updated = await updateFollowUp(params.follow_up_id, {
              status: 'sent',
              sent_at: isoNow(),
            });

            return `Follow-up #${updated.id} marked as sent.`;
          }

          default:
            return `Error: Unknown action "${params.action}". Use create, list, or complete.`;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('meet_track_followup failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
