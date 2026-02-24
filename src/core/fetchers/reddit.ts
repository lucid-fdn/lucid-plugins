import type { FetchResult, SourceType } from '../types/index.js';
import type { Source, ItemInsert } from '../types/index.js';
import { BaseFetcher } from './base.js';
import { log } from '../utils/logger.js';

const USER_AGENT = 'lucid-veille:1.0.0 (OpenClaw Plugin)';
const REDDIT_BASE = 'https://www.reddit.com';

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

interface RedditPost {
  kind: string;
  data: {
    id: string;
    title: string;
    selftext: string;
    author: string;
    permalink: string;
    url: string;
    created_utc: number;
    subreddit: string;
    link_flair_text: string | null;
    num_comments: number;
    score: number;
  };
}

interface RedditListingResponse {
  data: {
    children: RedditPost[];
    after: string | null;
  };
}

export class RedditFetcher extends BaseFetcher {
  readonly sourceType: SourceType = 'reddit';
  readonly name = 'Reddit Fetcher';

  isConfigured(): boolean {
    return true;
  }

  protected async doFetch(source: Source): Promise<FetchResult> {
    const items: ItemInsert[] = [];
    const errors: string[] = [];

    // Normalize URL: ensure it ends with .json
    let jsonUrl = source.url.replace(/\/+$/, '');
    if (!jsonUrl.endsWith('.json')) {
      jsonUrl += '.json';
    }

    let response: Response;
    try {
      response = await fetch(jsonUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { items: [], errors: [`Failed to fetch Reddit URL ${jsonUrl}: ${msg}`] };
    }

    if (!response.ok) {
      return {
        items: [],
        errors: [`Reddit API returned ${response.status} ${response.statusText} for ${jsonUrl}`],
      };
    }

    let listing: RedditListingResponse;
    try {
      const json: unknown = await response.json();

      // Reddit can return an array for certain endpoints (e.g., post + comments)
      if (Array.isArray(json)) {
        listing = json[0] as RedditListingResponse;
      } else {
        listing = json as RedditListingResponse;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { items: [], errors: [`Failed to parse Reddit JSON response: ${msg}`] };
    }

    const posts = listing?.data?.children ?? [];

    for (const post of posts) {
      try {
        // Skip non-link/self posts (e.g., "more" kind)
        if (post.kind !== 't3') continue;

        const data = post.data;
        const permalink = data.permalink.startsWith('http')
          ? data.permalink
          : `${REDDIT_BASE}${data.permalink}`;

        const tags: string[] = [data.subreddit];
        if (data.link_flair_text) {
          tags.push(data.link_flair_text);
        }

        const item: ItemInsert = {
          tenant_id: source.tenant_id,
          source_id: source.id,
          canonical_url: permalink,
          title: data.title,
          summary: data.selftext ? truncate(data.selftext, 500) : undefined,
          author: data.author,
          published_at: new Date(data.created_utc * 1000).toISOString(),
          source: source.url,
          tags,
        };

        items.push(item);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error processing Reddit post: ${msg}`);
        log.warn(`Error processing Reddit post from ${source.url}: ${msg}`);
      }
    }

    log.info(`Reddit fetched ${items.length} posts from ${source.url}`);
    return { items, errors };
  }
}
