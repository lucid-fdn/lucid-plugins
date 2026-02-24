// ---------------------------------------------------------------------------
// schema.ts -- TypeBox schema for plugin config (used by OpenClaw)
// ---------------------------------------------------------------------------

import { Type, type Static } from '@sinclair/typebox';

export const PluginConfigSchema = Type.Object({
  supabaseUrl: Type.String({ description: 'Supabase project URL' }),
  supabaseKey: Type.String({ description: 'Supabase anon/service key' }),
  tenantId: Type.Optional(Type.String({ description: 'Multi-tenancy ID', default: 'default' })),
  intercomApiKey: Type.Optional(Type.String({ description: 'Intercom API key for importing conversations' })),
  zendeskApiKey: Type.Optional(Type.String({ description: 'Zendesk API key for support ticket import' })),
  typeformApiKey: Type.Optional(Type.String({ description: 'Typeform API key for survey responses' })),
  slackWebhookUrl: Type.Optional(Type.String({ description: 'Slack incoming webhook URL for notifications' })),
  npsThreshold: Type.Optional(
    Type.Number({
      description: 'NPS score threshold for detractor classification (0-10)',
      default: 7,
      minimum: 0,
      maximum: 10,
    }),
  ),
  collectSchedule: Type.Optional(
    Type.String({ description: 'Cron for scheduled feedback collection', default: '0 */6 * * *' }),
  ),
});

export type PluginConfigInput = Static<typeof PluginConfigSchema>;
