// ---------------------------------------------------------------------------
// serpapi.ts -- SerpAPI provider for real-time SERP results
// ---------------------------------------------------------------------------

import { BaseProvider } from './base.js';
import type { PluginConfig } from '../types/config.js';
import type { Country } from '../types/common.js';
import type { SerpResultData } from '../types/provider.js';
import { log } from '../utils/logger.js';

const BASE_URL = 'https://serpapi.com/search.json';

const COUNTRY_TO_GL: Record<string, string> = {
  us: 'us',
  gb: 'uk',
  ca: 'ca',
  au: 'au',
  de: 'de',
  fr: 'fr',
  es: 'es',
  it: 'it',
  br: 'br',
  in: 'in',
  jp: 'jp',
};

export class SerpApiProvider extends BaseProvider {
  name = 'serpapi';
  private apiKey: string | undefined;

  constructor(config: PluginConfig) {
    super({ maxConcurrent: 2, minTime: 500 });
    this.apiKey = config.serpApiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getSerpResults(keyword: string, country: Country = 'us'): Promise<SerpResultData[]> {
    if (!this.isConfigured()) return [];
    log.debug(`serpapi: fetching SERP results for "${keyword}"`);

    return this.schedule(async () => {
      const gl = COUNTRY_TO_GL[country] ?? 'us';
      const url = `${BASE_URL}?q=${encodeURIComponent(keyword)}&gl=${gl}&api_key=${this.apiKey}&num=10`;
      try {
        const data = await this.fetchJson<{
          organic_results?: Array<{
            position: number;
            link: string;
            title: string;
            snippet: string;
            displayed_link: string;
          }>;
          search_information?: { total_results: number };
        }>(url);

        return (data.organic_results ?? []).map((r) => ({
          position: r.position,
          url: r.link || '',
          title: r.title || '',
          description: r.snippet || '',
          domain: r.displayed_link ? r.displayed_link.split('/')[0].replace('www.', '') : '',
          serp_features: [],
        }));
      } catch (err) {
        log.warn(`serpapi: failed to fetch SERP for "${keyword}"`, err);
        return [];
      }
    });
  }
}
