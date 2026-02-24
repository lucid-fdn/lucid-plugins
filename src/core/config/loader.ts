// ---------------------------------------------------------------------------
// loader.ts -- Configuration loader: raw > env vars > defaults
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';
import { CONFIG_DEFAULTS } from './defaults.js';
import { ConfigError } from '../utils/errors.js';

const ENV_MAP: Record<string, string> = {
  supabaseUrl: 'METRICS_SUPABASE_URL',
  supabaseKey: 'METRICS_SUPABASE_KEY',
  tenantId: 'METRICS_TENANT_ID',
  mixpanelApiKey: 'METRICS_MIXPANEL_API_KEY',
  mixpanelSecret: 'METRICS_MIXPANEL_SECRET',
  amplitudeApiKey: 'METRICS_AMPLITUDE_API_KEY',
  amplitudeSecret: 'METRICS_AMPLITUDE_SECRET',
  posthogApiKey: 'METRICS_POSTHOG_API_KEY',
  posthogHost: 'METRICS_POSTHOG_HOST',
  gaPropertyId: 'METRICS_GA_PROPERTY_ID',
  gaCredentials: 'METRICS_GA_CREDENTIALS',
  slackWebhookUrl: 'METRICS_SLACK_WEBHOOK_URL',
  reportSchedule: 'METRICS_REPORT_SCHEDULE',
  retentionWindow: 'METRICS_RETENTION_WINDOW',
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
      if (key === 'retentionWindow') return Number(env) as PluginConfig[K];
      return env as PluginConfig[K];
    }
    const def = (CONFIG_DEFAULTS as Record<string, unknown>)[key as string];
    if (def !== undefined) return def as PluginConfig[K];
    return undefined;
  };

  const supabaseUrl = get('supabaseUrl');
  const supabaseKey = get('supabaseKey');

  if (!supabaseUrl) {
    throw new ConfigError('supabaseUrl is required (set METRICS_SUPABASE_URL or pass in config)');
  }
  if (!supabaseKey) {
    throw new ConfigError('supabaseKey is required (set METRICS_SUPABASE_KEY or pass in config)');
  }

  const config: PluginConfig = {
    supabaseUrl,
    supabaseKey,
    tenantId: get('tenantId') ?? CONFIG_DEFAULTS.tenantId,
    reportSchedule: get('reportSchedule') ?? CONFIG_DEFAULTS.reportSchedule,
    retentionWindow: get('retentionWindow') ?? CONFIG_DEFAULTS.retentionWindow,
    ...(get('mixpanelApiKey') && { mixpanelApiKey: get('mixpanelApiKey') }),
    ...(get('mixpanelSecret') && { mixpanelSecret: get('mixpanelSecret') }),
    ...(get('amplitudeApiKey') && { amplitudeApiKey: get('amplitudeApiKey') }),
    ...(get('amplitudeSecret') && { amplitudeSecret: get('amplitudeSecret') }),
    ...(get('posthogApiKey') && { posthogApiKey: get('posthogApiKey') }),
    ...(get('posthogHost') && { posthogHost: get('posthogHost') }),
    ...(get('gaPropertyId') && { gaPropertyId: get('gaPropertyId') }),
    ...(get('gaCredentials') && { gaCredentials: get('gaCredentials') }),
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
