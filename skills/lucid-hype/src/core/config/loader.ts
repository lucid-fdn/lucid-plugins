// ---------------------------------------------------------------------------
// loader.ts -- Configuration loader: raw > env vars > defaults
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';
import { CONFIG_DEFAULTS } from './defaults.js';
import { ConfigError } from '../utils/errors.js';

const ENV_MAP: Record<string, string> = {
  supabaseUrl: 'HYPE_SUPABASE_URL',
  supabaseKey: 'HYPE_SUPABASE_KEY',
  tenantId: 'HYPE_TENANT_ID',
  twitterApiKey: 'HYPE_TWITTER_API_KEY',
  twitterApiSecret: 'HYPE_TWITTER_API_SECRET',
  linkedinAccessToken: 'HYPE_LINKEDIN_ACCESS_TOKEN',
  redditClientId: 'HYPE_REDDIT_CLIENT_ID',
  redditClientSecret: 'HYPE_REDDIT_CLIENT_SECRET',
  tiktokAccessToken: 'HYPE_TIKTOK_ACCESS_TOKEN',
  youtubeApiKey: 'HYPE_YOUTUBE_API_KEY',
  instagramAccessToken: 'HYPE_INSTAGRAM_ACCESS_TOKEN',
  productName: 'HYPE_PRODUCT_NAME',
  productDescription: 'HYPE_PRODUCT_DESCRIPTION',
  productUrl: 'HYPE_PRODUCT_URL',
  slackWebhookUrl: 'HYPE_SLACK_WEBHOOK_URL',
  postSchedule: 'HYPE_POST_SCHEDULE',
};

function envValue(key: string): string | undefined {
  const envKey = ENV_MAP[key];
  if (!envKey) return undefined;
  return process.env[envKey] || undefined;
}

let _cached: PluginConfig | undefined;

export function loadConfig(raw?: Partial<PluginConfig>): PluginConfig {
  const get = <K extends keyof PluginConfig>(key: K): PluginConfig[K] | undefined => {
    if (raw && raw[key] !== undefined) return raw[key];
    const env = envValue(key as string);
    if (env !== undefined) return env as PluginConfig[K];
    const def = (CONFIG_DEFAULTS as Record<string, unknown>)[key as string];
    if (def !== undefined) return def as PluginConfig[K];
    return undefined;
  };

  const supabaseUrl = get('supabaseUrl');
  const supabaseKey = get('supabaseKey');

  if (!supabaseUrl) {
    throw new ConfigError('supabaseUrl is required (set HYPE_SUPABASE_URL or pass in config)');
  }
  if (!supabaseKey) {
    throw new ConfigError('supabaseKey is required (set HYPE_SUPABASE_KEY or pass in config)');
  }

  const config: PluginConfig = {
    supabaseUrl,
    supabaseKey,
    tenantId: get('tenantId') ?? CONFIG_DEFAULTS.tenantId,
    productName: get('productName') ?? CONFIG_DEFAULTS.productName,
    productDescription: get('productDescription') ?? CONFIG_DEFAULTS.productDescription,
    productUrl: get('productUrl') ?? CONFIG_DEFAULTS.productUrl,
    postSchedule: get('postSchedule') ?? CONFIG_DEFAULTS.postSchedule,
    ...(get('twitterApiKey') && { twitterApiKey: get('twitterApiKey') }),
    ...(get('twitterApiSecret') && { twitterApiSecret: get('twitterApiSecret') }),
    ...(get('linkedinAccessToken') && { linkedinAccessToken: get('linkedinAccessToken') }),
    ...(get('redditClientId') && { redditClientId: get('redditClientId') }),
    ...(get('redditClientSecret') && { redditClientSecret: get('redditClientSecret') }),
    ...(get('tiktokAccessToken') && { tiktokAccessToken: get('tiktokAccessToken') }),
    ...(get('youtubeApiKey') && { youtubeApiKey: get('youtubeApiKey') }),
    ...(get('instagramAccessToken') && { instagramAccessToken: get('instagramAccessToken') }),
    ...(get('slackWebhookUrl') && { slackWebhookUrl: get('slackWebhookUrl') }),
  };

  _cached = config;
  return config;
}

export function getConfig(): PluginConfig {
  if (!_cached) return loadConfig();
  return _cached;
}

export function resetConfig(): void {
  _cached = undefined;
}
