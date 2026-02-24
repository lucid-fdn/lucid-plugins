import { BridgeError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { PluginConfig } from '../../domain/types/config.js';

const ENV_PREFIX = 'BRIDGE_';

function envKey(name: string): string {
  return `${ENV_PREFIX}${name.toUpperCase()}`;
}

function getEnv(name: string): string | undefined {
  return process.env[envKey(name)];
}

function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw BridgeError.configError(`Missing required env var: ${envKey(name)}`);
  }
  return value;
}

export function loadConfig(overrides?: Partial<PluginConfig>): PluginConfig {
  logger.info('Loading Bridge configuration');

  const config: PluginConfig = {
    supabaseUrl: overrides?.supabaseUrl ?? requireEnv('SUPABASE_URL'),
    supabaseKey: overrides?.supabaseKey ?? requireEnv('SUPABASE_KEY'),
    tenantId: overrides?.tenantId ?? requireEnv('TENANT_ID'),

    notionToken: overrides?.notionToken ?? getEnv('NOTION_TOKEN'),
    linearApiKey: overrides?.linearApiKey ?? getEnv('LINEAR_API_KEY'),
    slackBotToken: overrides?.slackBotToken ?? getEnv('SLACK_BOT_TOKEN'),
    githubToken: overrides?.githubToken ?? getEnv('GITHUB_TOKEN'),
    jiraHost: overrides?.jiraHost ?? getEnv('JIRA_HOST'),
    jiraEmail: overrides?.jiraEmail ?? getEnv('JIRA_EMAIL'),
    jiraToken: overrides?.jiraToken ?? getEnv('JIRA_TOKEN'),
    googleCredentials: overrides?.googleCredentials ?? getEnv('GOOGLE_CREDENTIALS'),
    discordBotToken: overrides?.discordBotToken ?? getEnv('DISCORD_BOT_TOKEN'),
    trelloApiKey: overrides?.trelloApiKey ?? getEnv('TRELLO_API_KEY'),
    trelloToken: overrides?.trelloToken ?? getEnv('TRELLO_TOKEN'),
    slackWebhookUrl: overrides?.slackWebhookUrl ?? getEnv('SLACK_WEBHOOK_URL'),
    syncSchedule: overrides?.syncSchedule ?? getEnv('SYNC_SCHEDULE') ?? '*/30 * * * *',
  };

  logger.info('Configuration loaded successfully', {
    tenantId: config.tenantId,
    hasNotion: !!config.notionToken,
    hasLinear: !!config.linearApiKey,
    hasSlack: !!config.slackBotToken,
    hasGithub: !!config.githubToken,
    hasJira: !!config.jiraHost,
  });

  return config;
}

export function validateConfig(config: PluginConfig): string[] {
  const errors: string[] = [];

  if (!config.supabaseUrl) errors.push('supabaseUrl is required');
  if (!config.supabaseKey) errors.push('supabaseKey is required');
  if (!config.tenantId) errors.push('tenantId is required');

  if (config.jiraHost && (!config.jiraEmail || !config.jiraToken)) {
    errors.push('jiraEmail and jiraToken are required when jiraHost is set');
  }

  if (config.trelloApiKey && !config.trelloToken) {
    errors.push('trelloToken is required when trelloApiKey is set');
  }

  return errors;
}
