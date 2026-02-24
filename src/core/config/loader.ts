import type { PluginConfig } from '../types/config.js';
import { DEFAULT_CONFIG } from './defaults.js';

let currentConfig: PluginConfig | null = null;

export function loadConfig(raw: Record<string, unknown>): PluginConfig {
  const env = typeof process !== 'undefined' ? process.env : {};

  const config: PluginConfig = {
    supabaseUrl: (raw.supabaseUrl as string) || env.SUPABASE_URL || '',
    supabaseKey: (raw.supabaseKey as string) || env.SUPABASE_SERVICE_ROLE_KEY || '',
    tenantId: (raw.tenantId as string) || env.VEILLE_TENANT_ID || DEFAULT_CONFIG.tenantId!,
    timezone: (raw.timezone as string) || DEFAULT_CONFIG.timezone!,
    language: (raw.language as string) || DEFAULT_CONFIG.language!,
    fetchCron: (raw.fetchCron as string) || DEFAULT_CONFIG.fetchCron!,
    dailyDigestCron: (raw.dailyDigestCron as string) || DEFAULT_CONFIG.dailyDigestCron!,
    weeklyDigestCron: (raw.weeklyDigestCron as string) || DEFAULT_CONFIG.weeklyDigestCron!,
    autoPublish: raw.autoPublish != null ? Boolean(raw.autoPublish) : DEFAULT_CONFIG.autoPublish!,
    digestTrustThreshold:
      typeof raw.digestTrustThreshold === 'number'
        ? raw.digestTrustThreshold
        : DEFAULT_CONFIG.digestTrustThreshold!,
    digestMaxItems:
      typeof raw.digestMaxItems === 'number'
        ? raw.digestMaxItems
        : DEFAULT_CONFIG.digestMaxItems!,
    twitterBearerToken: (raw.twitterBearerToken as string) || env.TWITTER_BEARER_TOKEN,
    twitterApiKey: (raw.twitterApiKey as string) || env.TWITTER_API_KEY,
    twitterApiSecret: (raw.twitterApiSecret as string) || env.TWITTER_API_SECRET,
    twitterAccessToken: (raw.twitterAccessToken as string) || env.TWITTER_ACCESS_TOKEN,
    twitterAccessSecret: (raw.twitterAccessSecret as string) || env.TWITTER_ACCESS_SECRET,
    ghostUrl: (raw.ghostUrl as string) || env.GHOST_URL,
    ghostAdminApiKey: (raw.ghostAdminApiKey as string) || env.GHOST_ADMIN_API_KEY,
    wordpressUrl: (raw.wordpressUrl as string) || env.WORDPRESS_URL,
    wordpressUsername: (raw.wordpressUsername as string) || env.WORDPRESS_USERNAME,
    wordpressPassword: (raw.wordpressPassword as string) || env.WORDPRESS_PASSWORD,
    linkedinAccessToken: (raw.linkedinAccessToken as string) || env.LINKEDIN_ACCESS_TOKEN,
    devtoApiKey: (raw.devtoApiKey as string) || env.DEVTO_API_KEY,
    telegramBotToken: (raw.telegramBotToken as string) || env.TELEGRAM_BOT_TOKEN,
    telegramChatId: (raw.telegramChatId as string) || env.TELEGRAM_CHAT_ID,
    slackWebhookUrl: (raw.slackWebhookUrl as string) || env.SLACK_WEBHOOK_URL,
    discordWebhookUrl: (raw.discordWebhookUrl as string) || env.DISCORD_WEBHOOK_URL,
    saasMode: raw.saasMode != null ? Boolean(raw.saasMode) : (env.VEILLE_SAAS_MODE === 'true' || undefined),
  };

  currentConfig = config;
  return config;
}

export function getConfig(): PluginConfig {
  if (!currentConfig) {
    throw new Error('Plugin config not loaded. Call loadConfig() first.');
  }
  return currentConfig;
}

export function resetConfig(): void {
  currentConfig = null;
}
