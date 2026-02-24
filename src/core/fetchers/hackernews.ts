import type { FetchResult, SourceType } from '../types/index.js';
import type { Source, ItemInsert } from '../types/index.js';
import { BaseFetcher } from './base.js';
import { log } from '../utils/logger.js';

const ALGOLIA_BASE = 'https://hn.algolia.com/api/v1';
const HN_ITEM_BASE = 'https://news.ycombinator.com/item?id=';

interface AlgoliaHit {
  objectID: string;
  title: string | null;
  url: string | null;
  author: string | null;
  created_at: string | null;
  story_text: string | null;
  _tags: string[] | null;
  points: number | null;
  num_comments: number | null;
}

interface AlgoliaSearchResponse {
  hits: AlgoliaHit[];
  nbHits: number;
  page: number;
  nbPages: number;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export class HackerNewsFetcher extends BaseFetcher {
  readonly sourceType: SourceType = 'hackernews';
  readonly name = 'HN Fetcher';

  isConfigured(): boolean {
    return true;
  }

  private buildApiUrl(source: Source): string {
    // Check fetch_config for custom query or tags
    const query =
      source.fetch_config?.query && typeof source.fetch_config.query === 'string'
        ? source.fetch_config.query
        : null;

    const tags =
      source.fetch_config?.tags && typeof source.fetch_config.tags === 'string'
        ? source.fetch_config.tags
        : null;

    const hitsPerPage =
      source.fetch_config?.hitsPerPage && typeof source.fetch_config.hitsPerPage === 'number'
        ? source.fetch_config.hitsPerPage
        : 30;

    // If a specific query is provided, use the search endpoint
    if (query) {
      const params = new URLSearchParams({
        query,
        hitsPerPage: String(hitsPerPage),
      });
      if (tags) {
        params.set('tags', tags);
      }
      return `${ALGOLIA_BASE}/search?${params.toString()}`;
    }

    // Default: fetch front page stories
    const params = new URLSearchParams({
      tags: tags ?? 'front_page',
      hitsPerPage: String(hitsPerPage),
    });
    return `${ALGOLIA_BASE}/search?${params.toString()}`;
  }

  protected async doFetch(source: Source): Promise<FetchResult> {
    const items: ItemInsert[] = [];
    const errors: string[] = [];

    const apiUrl = this.buildApiUrl(source);

    let response: Response;
    try {
      response = await fetch(apiUrl, {
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { items: [], errors: [`Failed to fetch HN Algolia API: ${msg}`] };
    }

    if (!response.ok) {
      return {
        items: [],
        errors: [
          `HN Algolia API returned ${response.status} ${response.statusText} for ${apiUrl}`,
        ],
      };
    }

    let data: AlgoliaSearchResponse;
    try {
      data = (await response.json()) as AlgoliaSearchResponse;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { items: [], errors: [`Failed to parse HN Algolia response: ${msg}`] };
    }

    for (const hit of data.hits) {
      try {
        const canonicalUrl = hit.url || `${HN_ITEM_BASE}${hit.objectID}`;

        let summary: string | undefined;
        if (hit.story_text) {
          summary = truncate(stripHtml(hit.story_text), 500);
        } else if (hit.title) {
          summary = hit.title;
        }

        const tags: string[] = [];
        if (hit._tags) {
          for (const tag of hit._tags) {
            // Skip auto-generated "story", "author_xxx" tags
            if (tag !== 'story' && tag !== 'comment' && !tag.startsWith('author_')) {
              tags.push(tag);
            }
          }
        }

        const item: ItemInsert = {
          tenant_id: source.tenant_id,
          source_id: source.id,
          canonical_url: canonicalUrl,
          title: hit.title ?? undefined,
          summary,
          author: hit.author ?? undefined,
          published_at: hit.created_at ?? undefined,
          source: source.url,
          tags: tags.length > 0 ? tags : undefined,
        };

        items.push(item);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error processing HN hit ${hit.objectID}: ${msg}`);
        log.warn(`Error processing HN hit ${hit.objectID}: ${msg}`);
      }
    }

    log.info(`HN fetched ${items.length} stories from Algolia API`);
    return { items, errors };
  }
}
