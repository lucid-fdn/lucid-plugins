import type { PluginConfig } from '../types/config.js';
import { DEFAULT_CONFIG } from '../types/config.js';
import { RecruitError } from '../utils/errors.js';

export function loadConfig(overrides?: Partial<PluginConfig>): PluginConfig {
  const env = process.env;

  const config: PluginConfig = {
    supabaseUrl: overrides?.supabaseUrl ?? env['RECRUIT_SUPABASE_URL'] ?? '',
    supabaseKey: overrides?.supabaseKey ?? env['RECRUIT_SUPABASE_KEY'] ?? '',
    tenantId: overrides?.tenantId ?? env['RECRUIT_TENANT_ID'] ?? 'default',
    linkedinApiKey: overrides?.linkedinApiKey ?? env['RECRUIT_LINKEDIN_API_KEY'],
    githubToken: overrides?.githubToken ?? env['RECRUIT_GITHUB_TOKEN'],
    leverApiKey: overrides?.leverApiKey ?? env['RECRUIT_LEVER_API_KEY'],
    greenhouseApiKey: overrides?.greenhouseApiKey ?? env['RECRUIT_GREENHOUSE_API_KEY'],
    slackWebhookUrl: overrides?.slackWebhookUrl ?? env['RECRUIT_SLACK_WEBHOOK_URL'],
    autoScreenEnabled:
      overrides?.autoScreenEnabled ??
      (env['RECRUIT_AUTO_SCREEN_ENABLED']
        ? env['RECRUIT_AUTO_SCREEN_ENABLED'] === 'true'
        : (DEFAULT_CONFIG.autoScreenEnabled ?? true)),
    screenSchedule:
      overrides?.screenSchedule ??
      env['RECRUIT_SCREEN_SCHEDULE'] ??
      DEFAULT_CONFIG.screenSchedule ??
      '0 8 * * *',
  };

  if (!config.supabaseUrl) {
    throw RecruitError.validation('RECRUIT_SUPABASE_URL is required');
  }
  if (!config.supabaseKey) {
    throw RecruitError.validation('RECRUIT_SUPABASE_KEY is required');
  }

  return config;
}
