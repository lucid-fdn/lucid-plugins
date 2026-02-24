// ---------------------------------------------------------------------------
// ahrefs.ts -- Ahrefs API provider
// ---------------------------------------------------------------------------

import { BaseProvider } from './base.js';
import type { PluginConfig } from '../types/config.js';
import type { Country } from '../types/common.js';
import type { KeywordData, BacklinkData } from '../types/provider.js';
import { log } from '../utils/logger.js';

const BASE_URL = 'https://apiv2.ahrefs.com';

export class AhrefsProvider extends BaseProvider {
  name = 'ahrefs';
  private apiKey: string | undefined;

  constructor(config: PluginConfig) {
    super({ maxConcurrent: 2, minTime: 600 });
    this.apiKey = config.ahrefsApiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getKeywordData(keywords: string[], _country: Country = 'us'): Promise<KeywordData[]> {
    if (!this.isConfigured()) return [];
    log.debug(`ahrefs: fetching keyword data for ${keywords.length} keywords`);

    return this.schedule(async () => {
      const results: KeywordData[] = [];
      for (const kw of keywords) {
        const url = `${BASE_URL}?token=${this.apiKey}&from=keywords_explorer&target=${encodeURIComponent(kw)}&mode=exact&output=json`;
        try {
          const data = await this.fetchJson<{ keywords?: Array<{ keyword: string; volume: number; cpc: number; difficulty: number }> }>(url);
          if (data.keywords && data.keywords.length > 0) {
            const item = data.keywords[0];
            results.push({
              keyword: item.keyword,
              search_volume: item.volume || 0,
              cpc: item.cpc || 0,
              competition: 0,
              difficulty: item.difficulty || 50,
            });
          }
        } catch (err) {
          log.warn(`ahrefs: failed to fetch data for "${kw}"`, err);
        }
      }
      return results;
    });
  }

  async getBacklinks(domain: string): Promise<BacklinkData> {
    if (!this.isConfigured()) {
      return {
        domain,
        referring_domains: 0,
        total_backlinks: 0,
        domain_authority: 0,
        page_authority: 0,
        spam_score: 0,
        dofollow_count: 0,
        nofollow_count: 0,
        top_links: [],
      };
    }

    return this.schedule(async () => {
      const url = `${BASE_URL}?token=${this.apiKey}&from=backlinks&target=${encodeURIComponent(domain)}&mode=domain&output=json&limit=20`;
      try {
        const data = await this.fetchJson<{
          stats?: { refdomains: number; backlinks: number; dofollow: number; nofollow: number };
          backlinks?: Array<{ url_from: string; url_to: string; anchor: string; nofollow: boolean }>;
        }>(url);
        return {
          domain,
          referring_domains: data.stats?.refdomains ?? 0,
          total_backlinks: data.stats?.backlinks ?? 0,
          domain_authority: 0,
          page_authority: 0,
          spam_score: 0,
          dofollow_count: data.stats?.dofollow ?? 0,
          nofollow_count: data.stats?.nofollow ?? 0,
          top_links: (data.backlinks ?? []).map((bl) => ({
            source_url: bl.url_from,
            source_domain: new URL(bl.url_from).hostname,
            anchor_text: bl.anchor || '',
            link_type: bl.nofollow ? 'nofollow' : 'dofollow',
          })),
        };
      } catch {
        return {
          domain,
          referring_domains: 0,
          total_backlinks: 0,
          domain_authority: 0,
          page_authority: 0,
          spam_score: 0,
          dofollow_count: 0,
          nofollow_count: 0,
          top_links: [],
        };
      }
    });
  }
}
