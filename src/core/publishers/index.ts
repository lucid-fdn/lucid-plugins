import type { Publisher, PublishPlatform, PluginConfig } from '../types/index.js';
import { GhostPublisher } from './ghost.js';
import { WordPressPublisher } from './wordpress.js';
import { TwitterPublisher } from './twitter.js';
import { LinkedInPublisher } from './linkedin.js';
import { DevToPublisher } from './devto.js';
import { TelegramPublisher } from './telegram.js';
import { SlackPublisher } from './slack.js';
import { DiscordPublisher } from './discord.js';
import { OpenClawChannelPublisher } from './openclaw-channel.js';

/**
 * Create a registry of all configured publishers based on the plugin config.
 * Only publishers whose credentials are fully configured will be included.
 */
export function createPublisherRegistry(
  config: PluginConfig,
  openclawApi?: unknown,
): Map<PublishPlatform, Publisher> {
  const registry = new Map<PublishPlatform, Publisher>();

  const publishers: Publisher[] = [
    new GhostPublisher({
      url: config.ghostUrl,
      adminApiKey: config.ghostAdminApiKey,
    }),
    new WordPressPublisher({
      url: config.wordpressUrl,
      username: config.wordpressUsername,
      password: config.wordpressPassword,
    }),
    new TwitterPublisher({
      apiKey: config.twitterApiKey,
      apiSecret: config.twitterApiSecret,
      accessToken: config.twitterAccessToken,
      accessSecret: config.twitterAccessSecret,
    }),
    new LinkedInPublisher({
      accessToken: config.linkedinAccessToken,
    }),
    new DevToPublisher({
      apiKey: config.devtoApiKey,
    }),
    new TelegramPublisher({
      botToken: config.telegramBotToken,
      chatId: config.telegramChatId,
    }),
    new SlackPublisher({
      webhookUrl: config.slackWebhookUrl,
    }),
    new DiscordPublisher({
      webhookUrl: config.discordWebhookUrl,
    }),
    new OpenClawChannelPublisher({
      api: openclawApi as { registerChannel?: (...args: unknown[]) => unknown },
    }),
  ];

  for (const publisher of publishers) {
    if (publisher.isConfigured()) {
      registry.set(publisher.platform, publisher);
    }
  }

  return registry;
}

// Re-export all publisher classes and their option types
export { BasePublisher } from './base.js';
export { GhostPublisher, type GhostPublisherOptions } from './ghost.js';
export { WordPressPublisher, type WordPressPublisherOptions } from './wordpress.js';
export { TwitterPublisher, type TwitterPublisherOptions } from './twitter.js';
export { LinkedInPublisher, type LinkedInPublisherOptions } from './linkedin.js';
export { DevToPublisher, type DevToPublisherOptions } from './devto.js';
export { TelegramPublisher, type TelegramPublisherOptions } from './telegram.js';
export { SlackPublisher, type SlackPublisherOptions } from './slack.js';
export { DiscordPublisher, type DiscordPublisherOptions } from './discord.js';
export {
  OpenClawChannelPublisher,
  type OpenClawChannelPublisherOptions,
} from './openclaw-channel.js';
