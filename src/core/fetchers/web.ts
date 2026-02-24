import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import type { FetchResult, SourceType } from '../types/index.js';
import type { Source, ItemInsert } from '../types/index.js';
import { BaseFetcher } from './base.js';
import { log } from '../utils/logger.js';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (compatible; Lucid-Veille/1.0; +https://github.com/openclaw)';

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '...';
}

export class WebFetcher extends BaseFetcher {
  readonly sourceType: SourceType = 'web';
  readonly name = 'Web Fetcher';

  isConfigured(): boolean {
    return true;
  }

  protected async doFetch(source: Source): Promise<FetchResult> {
    const items: ItemInsert[] = [];
    const errors: string[] = [];

    const timeoutMs =
      source.fetch_config?.timeoutMs && typeof source.fetch_config.timeoutMs === 'number'
        ? source.fetch_config.timeoutMs
        : DEFAULT_TIMEOUT_MS;

    let response: Response;
    try {
      response = await fetch(source.url, {
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          Accept: 'text/html, application/xhtml+xml, */*; q=0.8',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { items: [], errors: [`Failed to fetch web page ${source.url}: ${msg}`] };
    }

    if (!response.ok) {
      return {
        items: [],
        errors: [
          `Web page returned ${response.status} ${response.statusText} for ${source.url}`,
        ],
      };
    }

    let html: string;
    try {
      html = await response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { items: [], errors: [`Failed to read response body from ${source.url}: ${msg}`] };
    }

    // Try Readability first for article extraction
    let title: string | undefined;
    let summary: string | undefined;
    let author: string | undefined;

    try {
      const dom = new JSDOM(html, { url: source.url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (article) {
        title = article.title || undefined;
        author = article.byline || undefined;
        summary = article.textContent
          ? truncate(article.textContent.replace(/\s+/g, ' ').trim(), 500)
          : undefined;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.warn(`Readability parsing failed for ${source.url}, falling back to cheerio: ${msg}`);
      errors.push(`Readability extraction partial failure: ${msg}`);
    }

    // Fall back to cheerio if Readability didn't produce results
    if (!title || !summary) {
      try {
        const $ = cheerio.load(html);

        if (!title) {
          title =
            $('meta[property="og:title"]').attr('content') ||
            $('meta[name="twitter:title"]').attr('content') ||
            $('title').text().trim() ||
            undefined;
        }

        if (!summary) {
          const metaDesc =
            $('meta[property="og:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            $('meta[name="twitter:description"]').attr('content');

          if (metaDesc) {
            summary = truncate(metaDesc.trim(), 500);
          } else {
            // Last resort: first paragraph text
            const firstParagraph = $('article p, main p, .content p, p').first().text().trim();
            if (firstParagraph) {
              summary = truncate(firstParagraph, 500);
            }
          }
        }

        if (!author) {
          author =
            $('meta[name="author"]').attr('content') ||
            $('meta[property="article:author"]').attr('content') ||
            $('[rel="author"]').first().text().trim() ||
            undefined;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Cheerio fallback parsing failed: ${msg}`);
        log.warn(`Cheerio parsing failed for ${source.url}: ${msg}`);
      }
    }

    // Extract published date from meta tags
    let publishedAt: string | undefined;
    try {
      const $ = cheerio.load(html);
      const dateStr =
        $('meta[property="article:published_time"]').attr('content') ||
        $('meta[name="date"]').attr('content') ||
        $('meta[name="publish-date"]').attr('content') ||
        $('time[datetime]').first().attr('datetime');

      if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed.toISOString();
        }
      }
    } catch {
      // Ignore date extraction failures
    }

    const item: ItemInsert = {
      tenant_id: source.tenant_id,
      source_id: source.id,
      canonical_url: source.url,
      title,
      summary,
      author,
      published_at: publishedAt,
      source: source.url,
    };

    items.push(item);

    log.info(`Web fetched page: ${source.url} (title: ${title ?? 'unknown'})`);
    return { items, errors };
  }
}
