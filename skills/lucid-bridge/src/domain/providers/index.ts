import type { Platform } from '../types/common.js';
import type { PluginConfig } from '../types/config.js';
import { BaseProvider } from './base.js';
import { NotionProvider } from './notion.js';
import { LinearProvider } from './linear.js';
import { SlackProvider } from './slack.js';
import { GitHubProvider } from './github.js';
import { JiraProvider } from './jira.js';
import { logger } from '../../core/utils/logger.js';

export { BaseProvider, type ProviderSearchResult, type ProviderTask } from './base.js';
export { NotionProvider } from './notion.js';
export { LinearProvider } from './linear.js';
export { SlackProvider } from './slack.js';
export { GitHubProvider } from './github.js';
export { JiraProvider } from './jira.js';

export type ProviderRegistry = Map<Platform, BaseProvider>;

/**
 * Create a registry of all configured providers.
 */
export function createProviderRegistry(config: PluginConfig): ProviderRegistry {
  const registry: ProviderRegistry = new Map();

  if (config.notionToken) {
    registry.set('notion', new NotionProvider(config.notionToken));
    logger.info('Registered Notion provider');
  }

  if (config.linearApiKey) {
    registry.set('linear', new LinearProvider(config.linearApiKey));
    logger.info('Registered Linear provider');
  }

  if (config.slackBotToken) {
    registry.set('slack', new SlackProvider(config.slackBotToken));
    logger.info('Registered Slack provider');
  }

  if (config.githubToken) {
    registry.set('github', new GitHubProvider(config.githubToken));
    logger.info('Registered GitHub provider');
  }

  if (config.jiraHost && config.jiraEmail && config.jiraToken) {
    registry.set(
      'jira',
      new JiraProvider({
        host: config.jiraHost,
        email: config.jiraEmail,
        token: config.jiraToken,
      }),
    );
    logger.info('Registered Jira provider');
  }

  logger.info(`Provider registry created with ${registry.size} providers`);
  return registry;
}
