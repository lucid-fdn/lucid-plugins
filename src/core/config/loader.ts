// ---------------------------------------------------------------------------
// loader.ts -- Configuration loader: raw > env vars > defaults
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';
import { CONFIG_DEFAULTS } from './defaults.js';
import { ConfigError } from '../utils/errors.js';

const ENV_MAP: Record<string, string> = {
  supabaseUrl: 'SEO_SUPABASE_URL',
  supabaseKey: 'SEO_SUPABASE_KEY',
  tenantId: 'SEO_TENANT_ID',
  semrushApiKey: 'SEO_SEMRUSH_API_KEY',
  ahrefsApiKey: 'SEO_AHREFS_API_KEY',
  mozAccessId: 'SEO_MOZ_ACCESS_ID',
  mozSecretKey: 'SEO_MOZ_SECRET_KEY',
  serpApiKey: 'SEO_SERP_API_KEY',
  googleSearchConsoleCredentials: 'SEO_GSC_CREDENTIALS',
  dataportalApiKey: 'SEO_DATAPORTAL_API_KEY',
  slackWebhookUrl: 'SEO_SLACK_WEBHOOK_URL',
  crawlSchedule: 'SEO_CRAWL_SCHEDULE',
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
    throw new ConfigError('supabaseUrl is required (set SEO_SUPABASE_URL or pass in config)');
  }
  if (!supabaseKey) {
    throw new ConfigError('supabaseKey is required (set SEO_SUPABASE_KEY or pass in config)');
  }

  const config: PluginConfig = {
    supabaseUrl,
    supabaseKey,
    tenantId: get('tenantId') ?? CONFIG_DEFAULTS.tenantId,
    crawlSchedule: get('crawlSchedule') ?? CONFIG_DEFAULTS.crawlSchedule,
    ...(get('semrushApiKey') && { semrushApiKey: get('semrushApiKey') }),
    ...(get('ahrefsApiKey') && { ahrefsApiKey: get('ahrefsApiKey') }),
    ...(get('mozAccessId') && { mozAccessId: get('mozAccessId') }),
    ...(get('mozSecretKey') && { mozSecretKey: get('mozSecretKey') }),
    ...(get('serpApiKey') && { serpApiKey: get('serpApiKey') }),
    ...(get('googleSearchConsoleCredentials') && {
      googleSearchConsoleCredentials: get('googleSearchConsoleCredentials'),
    }),
    ...(get('dataportalApiKey') && { dataportalApiKey: get('dataportalApiKey') }),
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
