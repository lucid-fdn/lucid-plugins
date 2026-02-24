import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';
import { truncate } from '../utils/text.js';

export interface DiscordPublisherOptions {
  webhookUrl?: string;
}

/** Discord message content length limit. */
const DISCORD_MAX_LENGTH = 2000;

export class DiscordPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'discord';
  readonly name = 'Discord';

  private readonly webhookUrl: string | undefined;

  constructor(options: DiscordPublisherOptions) {
    super();
    this.webhookUrl = options.webhookUrl;
  }

  isConfigured(): boolean {
    return Boolean(this.webhookUrl);
  }

  protected async doPublish(input: PublishInput): Promise<PublishResult> {
    if (!this.webhookUrl) {
      return {
        success: false,
        platform: this.platform,
        error: 'Discord is not configured: missing webhookUrl',
      };
    }

    const content = truncate(
      `**${input.title}**\n\n${input.content}`,
      DISCORD_MAX_LENGTH,
    );

    log.debug(`Posting to Discord webhook (${content.length} chars)`);

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        platform: this.platform,
        error: `Discord webhook responded with ${response.status}: ${errorBody}`,
      };
    }

    log.info(`Discord message posted successfully`);

    return {
      success: true,
      platform: this.platform,
    };
  }
}
