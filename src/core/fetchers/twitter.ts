import { TwitterApi } from 'twitter-api-v2';
import type { FetchResult, SourceType } from '../types/index.js';
import type { Source, ItemInsert } from '../types/index.js';
import { BaseFetcher } from './base.js';
import { log } from '../utils/logger.js';

export interface TwitterFetcherConfig {
  bearerToken?: string;
}

export class TwitterFetcher extends BaseFetcher {
  readonly sourceType: SourceType = 'twitter';
  readonly name = 'Twitter Fetcher';

  private readonly bearerToken: string | undefined;

  constructor(config?: TwitterFetcherConfig) {
    super();
    this.bearerToken = config?.bearerToken;
  }

  isConfigured(): boolean {
    return !!this.bearerToken;
  }

  private extractQuery(source: Source): string | null {
    // Check fetch_config.query first
    if (source.fetch_config?.query && typeof source.fetch_config.query === 'string') {
      return source.fetch_config.query;
    }

    // Try to parse query from URL search params
    try {
      const url = new URL(source.url);

      // Handle twitter.com/search?q=...
      const searchParam = url.searchParams.get('q');
      if (searchParam) {
        return searchParam;
      }

      // Handle twitter.com/username -> from:username
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length === 1 && !pathParts[0].startsWith('i')) {
        return `from:${pathParts[0]}`;
      }
    } catch {
      // URL parsing failed, return null
    }

    return null;
  }

  protected async doFetch(source: Source): Promise<FetchResult> {
    const items: ItemInsert[] = [];
    const errors: string[] = [];

    if (!this.bearerToken) {
      return { items: [], errors: ['Twitter bearer token not configured'] };
    }

    const query = this.extractQuery(source);
    if (!query) {
      return {
        items: [],
        errors: [
          `Could not extract search query from source URL or fetch_config: ${source.url}`,
        ],
      };
    }

    const client = new TwitterApi(this.bearerToken);
    const readOnly = client.readOnly;

    try {
      const maxResults =
        source.fetch_config?.maxResults && typeof source.fetch_config.maxResults === 'number'
          ? Math.min(Math.max(source.fetch_config.maxResults, 10), 100)
          : 20;

      const result = await readOnly.v2.search(query, {
        max_results: maxResults,
        'tweet.fields': ['created_at', 'author_id', 'text', 'entities'],
      });

      for (const tweet of result.data?.data ?? []) {
        try {
          const item: ItemInsert = {
            tenant_id: source.tenant_id,
            source_id: source.id,
            canonical_url: `https://twitter.com/i/status/${tweet.id}`,
            title: undefined,
            summary: tweet.text,
            author: tweet.author_id ?? undefined,
            published_at: tweet.created_at ?? undefined,
            source: source.url,
            tags: extractHashtags(tweet),
          };

          items.push(item);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`Error processing tweet ${tweet.id}: ${msg}`);
          log.warn(`Error processing tweet ${tweet.id}: ${msg}`);
        }
      }

      log.info(`Twitter fetched ${items.length} tweets for query "${query}"`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Twitter API error: ${msg}`);
      log.error(`Twitter API error for ${source.url}: ${msg}`);
    }

    return { items, errors };
  }
}

function extractHashtags(tweet: { text: string }): string[] | undefined {
  const matches = tweet.text.match(/#\w+/g);
  if (!matches || matches.length === 0) return undefined;
  return matches.map((tag) => tag.slice(1));
}
