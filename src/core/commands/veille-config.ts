import type { PluginConfig } from '../types/index.js';
import { log } from '../utils/logger.js';

export interface VeilleConfigCommandDeps {
  config: PluginConfig;
}

/**
 * Set of config keys whose values are secrets and should be redacted in output.
 */
const SECRET_KEYS: ReadonlySet<string> = new Set([
  'supabaseKey',
  'twitterBearerToken',
  'twitterApiKey',
  'twitterApiSecret',
  'twitterAccessToken',
  'twitterAccessSecret',
  'ghostAdminApiKey',
  'wordpressPassword',
  'linkedinAccessToken',
  'devtoApiKey',
  'telegramBotToken',
  'slackWebhookUrl',
  'discordWebhookUrl',
]);

/**
 * Redact a value: if it's a non-empty string, replace with '***'.
 */
function redactValue(key: string, value: unknown): unknown {
  if (SECRET_KEYS.has(key) && typeof value === 'string' && value.length > 0) {
    return '***';
  }
  return value;
}

/**
 * Handler for the /veille-config command.
 *
 * Displays the current plugin configuration with secret values redacted.
 */
export function createVeilleConfigHandler(deps: VeilleConfigCommandDeps) {
  return async (): Promise<string> => {
    try {
      log.info('Running /veille-config command');

      const { config } = deps;

      const lines: string[] = ['=== Lucid Veille Configuration ===', ''];

      // Core settings
      lines.push('--- Core ---');
      lines.push(`  tenantId: ${config.tenantId}`);
      lines.push(`  supabaseUrl: ${config.supabaseUrl}`);
      lines.push(`  supabaseKey: ${redactValue('supabaseKey', config.supabaseKey)}`);
      lines.push(`  timezone: ${config.timezone}`);
      lines.push(`  language: ${config.language}`);
      lines.push('');

      // Schedule settings
      lines.push('--- Schedule ---');
      lines.push(`  fetchCron: ${config.fetchCron}`);
      lines.push(`  dailyDigestCron: ${config.dailyDigestCron}`);
      lines.push(`  weeklyDigestCron: ${config.weeklyDigestCron}`);
      lines.push(`  autoPublish: ${config.autoPublish}`);
      lines.push('');

      // Digest settings
      lines.push('--- Digest ---');
      lines.push(`  digestTrustThreshold: ${config.digestTrustThreshold}`);
      lines.push(`  digestMaxItems: ${config.digestMaxItems}`);
      lines.push('');

      // Integration credentials (redacted)
      lines.push('--- Integrations ---');

      const integrations: Array<[string, string | undefined]> = [
        ['twitterBearerToken', config.twitterBearerToken],
        ['twitterApiKey', config.twitterApiKey],
        ['twitterApiSecret', config.twitterApiSecret],
        ['twitterAccessToken', config.twitterAccessToken],
        ['twitterAccessSecret', config.twitterAccessSecret],
        ['ghostUrl', config.ghostUrl],
        ['ghostAdminApiKey', config.ghostAdminApiKey],
        ['wordpressUrl', config.wordpressUrl],
        ['wordpressUsername', config.wordpressUsername],
        ['wordpressPassword', config.wordpressPassword],
        ['linkedinAccessToken', config.linkedinAccessToken],
        ['devtoApiKey', config.devtoApiKey],
        ['telegramBotToken', config.telegramBotToken],
        ['telegramChatId', config.telegramChatId],
        ['slackWebhookUrl', config.slackWebhookUrl],
        ['discordWebhookUrl', config.discordWebhookUrl],
      ];

      for (const [key, value] of integrations) {
        const displayValue = value
          ? String(redactValue(key, value))
          : '(not set)';
        lines.push(`  ${key}: ${displayValue}`);
      }

      return lines.join('\n');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error('/veille-config command failed', msg);
      return `Error running veille-config: ${msg}`;
    }
  };
}
