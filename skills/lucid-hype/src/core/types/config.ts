// ---------------------------------------------------------------------------
// config.ts -- Plugin configuration interface
// ---------------------------------------------------------------------------

export interface PluginConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tenantId: string;

  // Platform API keys (optional)
  twitterApiKey?: string;
  twitterApiSecret?: string;
  linkedinAccessToken?: string;
  redditClientId?: string;
  redditClientSecret?: string;
  tiktokAccessToken?: string;
  youtubeApiKey?: string;
  instagramAccessToken?: string;

  // Product info
  productName: string;
  productDescription: string;
  productUrl: string;

  // Notifications
  slackWebhookUrl?: string;

  // Schedule (cron)
  postSchedule: string;
}

export const DEFAULT_POST_SCHEDULE = '0 9,12,15,18 * * 1-5';
