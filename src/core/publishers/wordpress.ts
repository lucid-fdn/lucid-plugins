import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';

export interface WordPressPublisherOptions {
  url?: string;
  username?: string;
  password?: string;
}

export class WordPressPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'wordpress';
  readonly name = 'WordPress';

  private readonly url: string | undefined;
  private readonly username: string | undefined;
  private readonly password: string | undefined;

  constructor(options: WordPressPublisherOptions) {
    super();
    this.url = options.url;
    this.username = options.username;
    this.password = options.password;
  }

  isConfigured(): boolean {
    return Boolean(this.url) && Boolean(this.username) && Boolean(this.password);
  }

  protected async doPublish(input: PublishInput): Promise<PublishResult> {
    if (!this.url || !this.username || !this.password) {
      return {
        success: false,
        platform: this.platform,
        error: 'WordPress is not configured: missing url, username, or password',
      };
    }

    const endpoint = `${this.url.replace(/\/+$/, '')}/wp-json/wp/v2/posts`;
    const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    log.debug(`Creating WordPress post at ${endpoint}: "${input.title}"`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        title: input.title,
        content: input.content,
        status: 'publish',
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        success: false,
        platform: this.platform,
        error: `WordPress API responded with ${response.status}: ${body}`,
      };
    }

    const data = (await response.json()) as { link?: string; id?: number };
    const externalUrl = data.link ?? `${this.url}/?p=${data.id}`;

    log.info(`WordPress post published: ${externalUrl}`);

    return {
      success: true,
      platform: this.platform,
      externalUrl,
    };
  }
}
