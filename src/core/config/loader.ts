// ---------------------------------------------------------------------------
// loader.ts -- Configuration loader: raw > env vars > defaults
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';
import { CONFIG_DEFAULTS } from './defaults.js';
import { ConfigError } from '../utils/errors.js';

const ENV_MAP: Record<string, string> = {
  supabaseUrl: 'FEEDBACK_SUPABASE_URL',
  supabaseKey: 'FEEDBACK_SUPABASE_KEY',
  tenantId: 'FEEDBACK_TENANT_ID',
  intercomApiKey: 'FEEDBACK_INTERCOM_API_KEY',
  zendeskApiKey: 'FEEDBACK_ZENDESK_API_KEY',
  typeformApiKey: 'FEEDBACK_TYPEFORM_API_KEY',
  slackWebhookUrl: 'FEEDBACK_SLACK_WEBHOOK_URL',
  npsThreshold: 'FEEDBACK_NPS_THRESHOLD',
  collectSchedule: 'FEEDBACK_COLLECT_SCHEDULE',
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
      if (key === 'npsThreshold') return Number(env) as PluginConfig[K];
      return env as PluginConfig[K];
    }
    const def = (CONFIG_DEFAULTS as Record<string, unknown>)[key as string];
    if (def !== undefined) return def as PluginConfig[K];
    return undefined;
  };

  const supabaseUrl = get('supabaseUrl');
  const supabaseKey = get('supabaseKey');

  if (!supabaseUrl) {
    throw new ConfigError('supabaseUrl is required (set FEEDBACK_SUPABASE_URL or pass in config)');
  }
  if (!supabaseKey) {
    throw new ConfigError('supabaseKey is required (set FEEDBACK_SUPABASE_KEY or pass in config)');
  }

  const config: PluginConfig = {
    supabaseUrl,
    supabaseKey,
    tenantId: get('tenantId') ?? CONFIG_DEFAULTS.tenantId,
    npsThreshold: get('npsThreshold') ?? CONFIG_DEFAULTS.npsThreshold,
    collectSchedule: get('collectSchedule') ?? CONFIG_DEFAULTS.collectSchedule,
    ...(get('intercomApiKey') && { intercomApiKey: get('intercomApiKey') }),
    ...(get('zendeskApiKey') && { zendeskApiKey: get('zendeskApiKey') }),
    ...(get('typeformApiKey') && { typeformApiKey: get('typeformApiKey') }),
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
