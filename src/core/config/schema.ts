// ---------------------------------------------------------------------------
// schema.ts -- TypeBox schema for plugin config (used by OpenClaw)
// ---------------------------------------------------------------------------

import { Type, type Static } from '@sinclair/typebox';

export const PluginConfigSchema = Type.Object({
  supabaseUrl: Type.String({ description: 'Supabase project URL' }),
  supabaseKey: Type.String({ description: 'Supabase anon/service key' }),
  tenantId: Type.Optional(Type.String({ description: 'Multi-tenancy ID', default: 'default' })),
  semrushApiKey: Type.Optional(Type.String({ description: 'SEMrush API key' })),
  ahrefsApiKey: Type.Optional(Type.String({ description: 'Ahrefs API key' })),
  mozAccessId: Type.Optional(Type.String({ description: 'Moz API access ID' })),
  mozSecretKey: Type.Optional(Type.String({ description: 'Moz API secret key' })),
  serpApiKey: Type.Optional(Type.String({ description: 'SerpAPI key for real-time SERP results' })),
  googleSearchConsoleCredentials: Type.Optional(
    Type.String({ description: 'Google Search Console credentials JSON' }),
  ),
  dataportalApiKey: Type.Optional(Type.String({ description: 'Data portal API key' })),
  slackWebhookUrl: Type.Optional(Type.String({ description: 'Slack incoming webhook URL' })),
  crawlSchedule: Type.Optional(
    Type.String({ description: 'Cron for weekly crawl schedule', default: '0 3 * * 0' }),
  ),
});

export type PluginConfigInput = Static<typeof PluginConfigSchema>;
