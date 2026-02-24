import RssParser from 'rss-parser';
import type { FetchResult, SourceType } from '../types/index.js';
import type { Source, ItemInsert } from '../types/index.js';
import { BaseFetcher } from './base.js';
import { log } from '../utils/logger.js';

const parser = new RssParser({
  timeout: 15_000,
  headers: {
    Accept: 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.1',
  },
});

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

export class RssFetcher extends BaseFetcher {
  readonly sourceType: SourceType = 'rss';
  readonly name = 'RSS Fetcher';

  isConfigured(): boolean {
    return true;
  }

  protected async doFetch(source: Source): Promise<FetchResult> {
    const items: ItemInsert[] = [];
    const errors: string[] = [];

    let feed: RssParser.Output<Record<string, unknown>>;
    try {
      feed = await parser.parseURL(source.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { items: [], errors: [`Failed to parse RSS feed ${source.url}: ${msg}`] };
    }

    for (const entry of feed.items) {
      try {
        const link = entry.link;
        if (!link) {
          errors.push(`RSS item missing link: ${entry.title ?? 'unknown'}`);
          continue;
        }

        const rawSummary =
          entry.contentSnippet ?? (entry.content ? stripHtml(entry.content) : undefined);

        const item: ItemInsert = {
          tenant_id: source.tenant_id,
          source_id: source.id,
          canonical_url: link,
          title: entry.title ?? undefined,
          summary: rawSummary ? truncate(rawSummary, 500) : undefined,
          author:
            (typeof entry.creator === 'string' ? entry.creator : undefined) ??
            (typeof entry.author === 'string' ? entry.author : undefined),
          published_at: entry.isoDate ?? undefined,
          source: source.url,
        };

        items.push(item);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error processing RSS item: ${msg}`);
        log.warn(`Error processing RSS item from ${source.url}: ${msg}`);
      }
    }

    log.info(`RSS fetched ${items.length} items from ${source.url}`);
    return { items, errors };
  }
}
