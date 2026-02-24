// ---------------------------------------------------------------------------
// index.ts -- Provider registry
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { GoogleCalendarProvider } from './google-calendar.js';
import { SlackProvider } from './slack.js';
import { NotionProvider } from './notion.js';
import { log } from '../utils/logger.js';

export function createProviderRegistry(config: PluginConfig): ProviderRegistry {
  const calendar = new GoogleCalendarProvider(config.calendarApiKey);
  const notification = new SlackProvider(config.slackBotToken, config.slackWebhookUrl);
  const notes = new NotionProvider(config.notionToken);

  const configured: string[] = [];
  if (calendar.isConfigured()) configured.push(calendar.name);
  if (notification.isConfigured()) configured.push(notification.name);
  if (notes.isConfigured()) configured.push(notes.name);

  log.info(`Provider registry: ${configured.length}/3 providers configured`);

  return {
    calendar: calendar.isConfigured() ? calendar : null,
    notification: notification.isConfigured() ? notification : null,
    notes: notes.isConfigured() ? notes : null,

    getConfiguredNames(): string[] {
      return configured;
    },
  };
}

export { GoogleCalendarProvider } from './google-calendar.js';
export { SlackProvider } from './slack.js';
export { NotionProvider } from './notion.js';
