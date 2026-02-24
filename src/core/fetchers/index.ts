import type { Fetcher } from '../types/index.js';
import type { PluginConfig } from '../types/index.js';
import type { SourceType } from '../types/index.js';
import { RssFetcher } from './rss.js';
import { TwitterFetcher } from './twitter.js';
import { RedditFetcher } from './reddit.js';
import { HackerNewsFetcher } from './hackernews.js';
import { WebFetcher } from './web.js';

export function createFetcherRegistry(config: PluginConfig): Map<SourceType, Fetcher> {
  const registry = new Map<SourceType, Fetcher>();

  const fetchers: Fetcher[] = [
    new RssFetcher(),
    new TwitterFetcher({ bearerToken: config.twitterBearerToken }),
    new RedditFetcher(),
    new HackerNewsFetcher(),
    new WebFetcher(),
  ];

  for (const fetcher of fetchers) {
    if (fetcher.isConfigured()) {
      registry.set(fetcher.sourceType, fetcher);
    }
  }

  return registry;
}

export { RssFetcher } from './rss.js';
export { TwitterFetcher } from './twitter.js';
export type { TwitterFetcherConfig } from './twitter.js';
export { RedditFetcher } from './reddit.js';
export { HackerNewsFetcher } from './hackernews.js';
export { WebFetcher } from './web.js';
export { getRateLimiter, clearLimiters } from './rate-limiter.js';
