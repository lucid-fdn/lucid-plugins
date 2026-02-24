import { TwitterApi } from 'twitter-api-v2';
import type { TwitterApiv2 } from 'twitter-api-v2';
import type { PublishInput, PublishResult, PublishPlatform } from '../types/index.js';
import { BasePublisher } from './base.js';
import { log } from '../utils/logger.js';
import { truncate } from '../utils/text.js';

export interface TwitterPublisherOptions {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  accessSecret?: string;
}

/** Maximum length of a single tweet. */
const TWEET_MAX_LENGTH = 280;

/**
 * Split content formatted as a numbered thread (1/ ..., 2/ ..., etc.)
 * into individual tweet strings.
 */
function splitThread(content: string): string[] {
  // Match lines starting with a number followed by "/" (e.g. "1/ ...", "2/ ...")
  const parts = content.split(/(?=^\d+\/\s)/m).map((s) => s.trim()).filter(Boolean);

  if (parts.length > 1) {
    return parts;
  }

  // Fallback: return the full content as a single tweet
  return [content];
}

export class TwitterPublisher extends BasePublisher {
  readonly platform: PublishPlatform = 'twitter';
  readonly name = 'Twitter / X';

  private readonly apiKey: string | undefined;
  private readonly apiSecret: string | undefined;
  private readonly accessToken: string | undefined;
  private readonly accessSecret: string | undefined;

  constructor(options: TwitterPublisherOptions) {
    super();
    this.apiKey = options.apiKey;
    this.apiSecret = options.apiSecret;
    this.accessToken = options.accessToken;
    this.accessSecret = options.accessSecret;
  }

  isConfigured(): boolean {
    return (
      Boolean(this.apiKey) &&
      Boolean(this.apiSecret) &&
      Boolean(this.accessToken) &&
      Boolean(this.accessSecret)
    );
  }

  protected async doPublish(input: PublishInput): Promise<PublishResult> {
    if (!this.apiKey || !this.apiSecret || !this.accessToken || !this.accessSecret) {
      return {
        success: false,
        platform: this.platform,
        error: 'Twitter is not configured: missing API credentials',
      };
    }

    const client = new TwitterApi({
      appKey: this.apiKey,
      appSecret: this.apiSecret,
      accessToken: this.accessToken,
      accessSecret: this.accessSecret,
    });

    const v2 = client.v2;

    if (input.format === 'x_thread') {
      return this.publishThread(v2, input);
    }

    return this.publishSingleTweet(v2, input);
  }

  private async publishSingleTweet(
    v2: TwitterApiv2,
    input: PublishInput,
  ): Promise<PublishResult> {
    const text = truncate(input.content, TWEET_MAX_LENGTH);

    log.debug(`Posting single tweet (${text.length} chars)`);

    const { data } = await v2.tweet(text);
    const tweetUrl = `https://twitter.com/i/status/${data.id}`;

    log.info(`Tweet published: ${tweetUrl}`);

    return {
      success: true,
      platform: this.platform,
      externalUrl: tweetUrl,
    };
  }

  private async publishThread(
    v2: TwitterApiv2,
    input: PublishInput,
  ): Promise<PublishResult> {
    const tweets = splitThread(input.content);

    log.debug(`Posting thread with ${tweets.length} tweets`);

    // Post the first tweet
    const firstText = truncate(tweets[0], TWEET_MAX_LENGTH);
    const { data: firstTweet } = await v2.tweet(firstText);
    const firstTweetUrl = `https://twitter.com/i/status/${firstTweet.id}`;

    let previousTweetId = firstTweet.id;

    // Post remaining tweets as replies
    for (let i = 1; i < tweets.length; i++) {
      const text = truncate(tweets[i], TWEET_MAX_LENGTH);
      const { data: reply } = await v2.tweet(text, {
        reply: { in_reply_to_tweet_id: previousTweetId },
      });
      previousTweetId = reply.id;
    }

    log.info(`Thread published (${tweets.length} tweets): ${firstTweetUrl}`);

    return {
      success: true,
      platform: this.platform,
      externalUrl: firstTweetUrl,
    };
  }
}
