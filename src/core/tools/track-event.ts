// ---------------------------------------------------------------------------
// track-event.ts -- Ingest a product analytics event
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import { ingestEvent } from '../db/events.js';
import { EVENT_TYPES } from '../types/common.js';
import { log } from '../utils/logger.js';

interface TrackEventParams {
  event_name: string;
  user_id?: string;
  properties?: Record<string, unknown>;
  event_type?: string;
}

export function createTrackEventTool(deps: { config: PluginConfig }): ToolDefinition<TrackEventParams> {
  return {
    name: 'metrics_track_event',
    description:
      'Track a product analytics event. Ingests events like page views, clicks, purchases, signups, and custom events into the analytics database.',
    params: {
      event_name: { type: 'string', required: true, description: 'Name of the event (e.g. "button_click", "purchase")' },
      user_id: { type: 'string', required: false, description: 'User ID associated with the event' },
      properties: { type: 'object', required: false, description: 'Additional event properties (key-value pairs)' },
      event_type: {
        type: 'enum',
        required: false,
        description: 'Type of event',
        values: [...EVENT_TYPES],
        default: 'custom',
      },
    },
    execute: async (params: TrackEventParams): Promise<string> => {
      try {
        const event = await ingestEvent({
          tenant_id: deps.config.tenantId,
          event_name: params.event_name,
          event_type: (params.event_type as (typeof EVENT_TYPES)[number]) ?? 'custom',
          user_id: params.user_id,
          properties: params.properties,
        });

        const lines = [
          '## Event Tracked',
          '',
          `- **Event**: ${event.event_name}`,
          `- **Type**: ${event.event_type}`,
          `- **User**: ${event.user_id ?? 'anonymous'}`,
          `- **Timestamp**: ${event.timestamp}`,
          `- **ID**: ${event.id}`,
        ];

        if (params.properties && Object.keys(params.properties).length > 0) {
          lines.push('', '### Properties');
          for (const [key, value] of Object.entries(params.properties)) {
            lines.push(`- ${key}: ${JSON.stringify(value)}`);
          }
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('metrics_track_event failed', msg);
        return `Error tracking event: ${msg}`;
      }
    },
  };
}
