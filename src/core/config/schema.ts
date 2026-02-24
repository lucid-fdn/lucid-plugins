import { Type, type Static } from '@sinclair/typebox';

export const PluginConfigSchema = Type.Object({
  supabaseUrl: Type.String({ description: 'Supabase project URL' }),
  supabaseKey: Type.String({ description: 'Supabase service role key' }),
  tenantId: Type.String({ default: 'personal', description: 'Tenant identifier' }),
  timezone: Type.String({ default: 'Europe/Paris', description: 'Timezone for schedules' }),
  language: Type.String({ default: 'fr', description: 'Digest language (ISO 639-1)' }),
  fetchCron: Type.String({ default: '0 6 * * *', description: 'Cron for source fetching' }),
  dailyDigestCron: Type.String({ default: '0 8 * * *', description: 'Cron for daily digest' }),
  weeklyDigestCron: Type.String({ default: '0 9 * * 1', description: 'Cron for weekly digest' }),
  autoPublish: Type.Boolean({ default: false, description: 'Auto-publish digests' }),
  digestTrustThreshold: Type.Number({
    default: 30,
    minimum: 0,
    maximum: 100,
    description: 'Minimum trust score for digest inclusion',
  }),
  digestMaxItems: Type.Number({
    default: 50,
    minimum: 1,
    description: 'Maximum items per digest',
  }),
  twitterBearerToken: Type.Optional(Type.String()),
  twitterApiKey: Type.Optional(Type.String()),
  twitterApiSecret: Type.Optional(Type.String()),
  twitterAccessToken: Type.Optional(Type.String()),
  twitterAccessSecret: Type.Optional(Type.String()),
  ghostUrl: Type.Optional(Type.String()),
  ghostAdminApiKey: Type.Optional(Type.String()),
  wordpressUrl: Type.Optional(Type.String()),
  wordpressUsername: Type.Optional(Type.String()),
  wordpressPassword: Type.Optional(Type.String()),
  linkedinAccessToken: Type.Optional(Type.String()),
  devtoApiKey: Type.Optional(Type.String()),
  telegramBotToken: Type.Optional(Type.String()),
  telegramChatId: Type.Optional(Type.String()),
  slackWebhookUrl: Type.Optional(Type.String()),
  discordWebhookUrl: Type.Optional(Type.String()),
  saasMode: Type.Optional(Type.Boolean({ default: false, description: 'Enable SaaS mode (multi-tenant webhooks, API keys, bridge)' })),
});

export type PluginConfigFromSchema = Static<typeof PluginConfigSchema>;
