import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';

export interface SlackPublisherOptions {
  webhookUrl?: string;
}

export class SlackPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'slack';
  readonly name = 'Slack';

  private readonly webhookUrl: string | undefined;

  constructor(options: SlackPublisherOptions) {
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
        error: 'Slack is not configured: missing webhookUrl',
      };
    }

    const text = `*${input.title}*\n\n${input.content}`;

    log.debug(`Posting to Slack webhook (${text.length} chars)`);

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        platform: this.platform,
        error: `Slack webhook responded with ${response.status}: ${errorBody}`,
      };
    }

    log.info(`Slack message posted successfully`);

    return {
      success: true,
      platform: this.platform,
    };
  }
}
