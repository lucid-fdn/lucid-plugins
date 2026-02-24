// ---------------------------------------------------------------------------
// loader.ts -- Configuration loader: raw > env vars > defaults
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';
import { CONFIG_DEFAULTS } from './defaults.js';
import { ConfigError } from '../utils/errors.js';

const ENV_MAP: Record<string, string> = {
  supabaseUrl: 'MEET_SUPABASE_URL',
  supabaseKey: 'MEET_SUPABASE_KEY',
  tenantId: 'MEET_TENANT_ID',
  calendarApiKey: 'MEET_CALENDAR_API_KEY',
  slackBotToken: 'MEET_SLACK_BOT_TOKEN',
  notionToken: 'MEET_NOTION_TOKEN',
  linearApiKey: 'MEET_LINEAR_API_KEY',
  slackWebhookUrl: 'MEET_SLACK_WEBHOOK_URL',
  digestSchedule: 'MEET_DIGEST_SCHEDULE',
  autoFollowUpDays: 'MEET_AUTO_FOLLOW_UP_DAYS',
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
    if (env !== undefined) {
      if (key === 'autoFollowUpDays') return Number(env) as PluginConfig[K];
      return env as PluginConfig[K];
    }
    const def = (CONFIG_DEFAULTS as Record<string, unknown>)[key as string];
    if (def !== undefined) return def as PluginConfig[K];
    return undefined;
  };

  const supabaseUrl = get('supabaseUrl');
  const supabaseKey = get('supabaseKey');

  if (!supabaseUrl) {
    throw new ConfigError('supabaseUrl is required (set MEET_SUPABASE_URL or pass in config)');
  }
  if (!supabaseKey) {
    throw new ConfigError('supabaseKey is required (set MEET_SUPABASE_KEY or pass in config)');
  }

  const config: PluginConfig = {
    supabaseUrl,
    supabaseKey,
    tenantId: get('tenantId') ?? CONFIG_DEFAULTS.tenantId,
    digestSchedule: get('digestSchedule') ?? CONFIG_DEFAULTS.digestSchedule,
    autoFollowUpDays: get('autoFollowUpDays') ?? CONFIG_DEFAULTS.autoFollowUpDays,
    ...(get('calendarApiKey') && { calendarApiKey: get('calendarApiKey') }),
    ...(get('slackBotToken') && { slackBotToken: get('slackBotToken') }),
    ...(get('notionToken') && { notionToken: get('notionToken') }),
    ...(get('linearApiKey') && { linearApiKey: get('linearApiKey') }),
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
