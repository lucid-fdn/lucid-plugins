// ---------------------------------------------------------------------------
// schema.ts -- TypeBox schema for plugin config (used by OpenClaw)
// ---------------------------------------------------------------------------

import { Type, type Static } from '@sinclair/typebox';

export const PluginConfigSchema = Type.Object({
  supabaseUrl: Type.String({ description: 'Supabase project URL' }),
  supabaseKey: Type.String({ description: 'Supabase anon/service key' }),
  tenantId: Type.Optional(Type.String({ description: 'Multi-tenancy ID', default: 'default' })),
  calendarApiKey: Type.Optional(Type.String({ description: 'Google Calendar API key' })),
  slackBotToken: Type.Optional(Type.String({ description: 'Slack bot token for sending summaries' })),
  notionToken: Type.Optional(Type.String({ description: 'Notion API integration token' })),
  linearApiKey: Type.Optional(Type.String({ description: 'Linear API key for issue tracking' })),
  slackWebhookUrl: Type.Optional(Type.String({ description: 'Slack incoming webhook URL' })),
  digestSchedule: Type.Optional(
    Type.String({ description: 'Cron for daily action item digest', default: '0 9 * * 1-5' }),
  ),
  autoFollowUpDays: Type.Optional(
    Type.Number({ description: 'Days before auto follow-up on pending actions', default: 3 }),
  ),
});

export type PluginConfigInput = Static<typeof PluginConfigSchema>;
