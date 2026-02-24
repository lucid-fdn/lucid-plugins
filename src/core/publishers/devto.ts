import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';

export interface DevToPublisherOptions {
  apiKey?: string;
}

/** dev.to articles API endpoint. */
const DEVTO_API_URL = 'https://dev.to/api/articles';

export class DevToPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'devto';
  readonly name = 'dev.to';

  private readonly apiKey: string | undefined;

  constructor(options: DevToPublisherOptions) {
    super();
    this.apiKey = options.apiKey;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  protected async doPublish(input: PublishInput): Promise<PublishResult> {
    if (!this.apiKey) {
      return {
        success: false,
        platform: this.platform,
        error: 'dev.to is not configured: missing apiKey',
      };
    }

    log.debug(`Creating dev.to article: "${input.title}"`);

    const response = await fetch(DEVTO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        article: {
          title: input.title,
          body_markdown: input.content,
          published: true,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        platform: this.platform,
        error: `dev.to API responded with ${response.status}: ${errorBody}`,
      };
    }

    const data = (await response.json()) as { url?: string; id?: number };
    const externalUrl = data.url ?? `https://dev.to/api/articles/${data.id}`;

    log.info(`dev.to article published: ${externalUrl}`);

    return {
      success: true,
      platform: this.platform,
      externalUrl,
    };
  }
}
