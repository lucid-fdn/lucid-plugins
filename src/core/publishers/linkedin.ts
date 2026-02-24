import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';
import { truncate } from '../utils/text.js';

export interface LinkedInPublisherOptions {
  accessToken?: string;
}

/** LinkedIn UGC API endpoint. */
const LINKEDIN_UGC_URL = 'https://api.linkedin.com/v2/ugcPosts';

/** Maximum commentary length for LinkedIn posts. */
const LINKEDIN_MAX_LENGTH = 1300;

export class LinkedInPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'linkedin';
  readonly name = 'LinkedIn';

  private readonly accessToken: string | undefined;

  constructor(options: LinkedInPublisherOptions) {
    super();
    this.accessToken = options.accessToken;
  }

  isConfigured(): boolean {
    return Boolean(this.accessToken);
  }

  protected async doPublish(input: PublishInput): Promise<PublishResult> {
    if (!this.accessToken) {
      return {
        success: false,
        platform: this.platform,
        error: 'LinkedIn is not configured: missing accessToken',
      };
    }

    // Fetch the current user's profile URN
    const profileUrn = await this.getProfileUrn();

    const commentary = truncate(
      `${input.title}\n\n${input.content}`,
      LINKEDIN_MAX_LENGTH,
    );

    log.debug(`Posting to LinkedIn (${commentary.length} chars)`);

    const body = {
      author: profileUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: commentary,
          },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await fetch(LINKEDIN_UGC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        platform: this.platform,
        error: `LinkedIn API responded with ${response.status}: ${errorBody}`,
      };
    }

    const data = (await response.json()) as { id?: string };

    log.info(`LinkedIn post published: ${data.id ?? 'unknown id'}`);

    // LinkedIn does not return a direct post URL from the UGC API,
    // so we provide the activity feed as a best-effort link.
    return {
      success: true,
      platform: this.platform,
      externalUrl: data.id
        ? `https://www.linkedin.com/feed/update/${data.id}`
        : 'https://www.linkedin.com/feed/',
    };
  }

  /**
   * Retrieve the authenticated user's LinkedIn profile URN.
   */
  private async getProfileUrn(): Promise<string> {
    const response = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch LinkedIn profile: ${response.status}`);
    }

    const data = (await response.json()) as { id?: string };

    if (!data.id) {
      throw new Error('LinkedIn profile response missing id');
    }

    return `urn:li:person:${data.id}`;
  }
}
