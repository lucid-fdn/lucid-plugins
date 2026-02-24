import GhostAdminAPI from '@tryghost/admin-api';
import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';

export interface GhostPublisherOptions {
  url?: string;
  adminApiKey?: string;
}

export class GhostPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'ghost';
  readonly name = 'Ghost CMS';

  private readonly url: string | undefined;
  private readonly adminApiKey: string | undefined;

  constructor(options: GhostPublisherOptions) {
    super();
    this.url = options.url;
    this.adminApiKey = options.adminApiKey;
  }

  isConfigured(): boolean {
    return Boolean(this.url) && Boolean(this.adminApiKey);
  }

  protected async doPublish(input: PublishInput): Promise<PublishResult> {
    if (!this.url || !this.adminApiKey) {
      return {
        success: false,
        platform: this.platform,
        error: 'Ghost CMS is not configured: missing url or adminApiKey',
      };
    }

    const api = new GhostAdminAPI({
      url: this.url,
      key: this.adminApiKey,
      version: 'v5.0',
    });

    log.debug(`Creating Ghost post: "${input.title}"`);

    const post = await api.posts.add(
      {
        title: input.title,
        html: input.content,
        status: 'published',
      },
      { source: 'html' },
    );

    const externalUrl = post.url as string | undefined;

    log.info(`Ghost post published: ${externalUrl ?? post.id}`);

    return {
      success: true,
      platform: this.platform,
      externalUrl: externalUrl ?? `${this.url}/p/${post.id}`,
    };
  }
}
