// ---------------------------------------------------------------------------
// schema.ts -- TypeBox schema for plugin config (used by OpenClaw)
// ---------------------------------------------------------------------------

import { Type, type Static } from '@sinclair/typebox';

export const PluginConfigSchema = Type.Object({
  supabaseUrl: Type.String({ description: 'Supabase project URL' }),
  supabaseKey: Type.String({ description: 'Supabase anon/service key' }),
  tenantId: Type.Optional(Type.String({ description: 'Multi-tenancy ID', default: 'default' })),
  mixpanelApiKey: Type.Optional(Type.String({ description: 'Mixpanel API key' })),
  mixpanelSecret: Type.Optional(Type.String({ description: 'Mixpanel API secret' })),
  amplitudeApiKey: Type.Optional(Type.String({ description: 'Amplitude API key' })),
  amplitudeSecret: Type.Optional(Type.String({ description: 'Amplitude secret key' })),
  posthogApiKey: Type.Optional(Type.String({ description: 'PostHog personal API key' })),
  posthogHost: Type.Optional(Type.String({ description: 'PostHog host URL (for self-hosted)', default: 'https://app.posthog.com' })),
  gaPropertyId: Type.Optional(Type.String({ description: 'Google Analytics 4 property ID' })),
  gaCredentials: Type.Optional(Type.String({ description: 'Google Analytics service account credentials (JSON)' })),
  slackWebhookUrl: Type.Optional(Type.String({ description: 'Slack incoming webhook URL for reports' })),
  reportSchedule: Type.Optional(Type.String({ description: 'Cron expression for weekly report', default: '0 9 * * 1' })),
  retentionWindow: Type.Optional(Type.Number({ description: 'Retention analysis window in days', default: 30 })),
});

export type PluginConfigInput = Static<typeof PluginConfigSchema>;
