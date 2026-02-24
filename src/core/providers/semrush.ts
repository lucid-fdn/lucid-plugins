// ---------------------------------------------------------------------------
// semrush.ts -- SEMrush API provider
// ---------------------------------------------------------------------------

import { BaseProvider } from './base.js';
import type { PluginConfig } from '../types/config.js';
import type { Country } from '../types/common.js';
import type { KeywordData, SerpResultData, BacklinkData, CompetitorData } from '../types/provider.js';
import { log } from '../utils/logger.js';

const BASE_URL = 'https://api.semrush.com';

export class SemrushProvider extends BaseProvider {
  name = 'semrush';
  private apiKey: string | undefined;

  constructor(config: PluginConfig) {
    super({ maxConcurrent: 3, minTime: 400 });
    this.apiKey = config.semrushApiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getKeywordData(keywords: string[], country: Country = 'us'): Promise<KeywordData[]> {
    if (!this.isConfigured()) return [];
    log.debug(`semrush: fetching keyword data for ${keywords.length} keywords`);

    return this.schedule(async () => {
      const results: KeywordData[] = [];
      for (const kw of keywords) {
        const url = `${BASE_URL}/?type=phrase_all&key=${this.apiKey}&phrase=${encodeURIComponent(kw)}&database=${country}&export_columns=Ph,Nq,Cp,Co,Nr`;
        try {
          const text = await this.fetchJson<string>(url);
          const lines = String(text).split('\n').filter(Boolean);
          if (lines.length > 1) {
            const parts = lines[1].split(';');
            results.push({
              keyword: parts[0] || kw,
              search_volume: parseInt(parts[1], 10) || 0,
              cpc: parseFloat(parts[2]) || 0,
              competition: parseFloat(parts[3]) || 0,
              difficulty: parseInt(parts[4], 10) || 50,
            });
          }
        } catch (err) {
          log.warn(`semrush: failed to fetch data for "${kw}"`, err);
        }
      }
      return results;
    });
  }

  async getSerpResults(keyword: string, country: Country = 'us'): Promise<SerpResultData[]> {
    if (!this.isConfigured()) return [];

    return this.schedule(async () => {
      const url = `${BASE_URL}/?type=phrase_organic&key=${this.apiKey}&phrase=${encodeURIComponent(keyword)}&database=${country}&display_limit=10&export_columns=Dn,Ur,Fk,Fp`;
      try {
        const text = await this.fetchJson<string>(url);
        const lines = String(text).split('\n').filter(Boolean);
        return lines.slice(1).map((line, i) => {
          const parts = line.split(';');
          return {
            position: i + 1,
            url: parts[1] || '',
            title: '',
            description: '',
            domain: parts[0] || '',
            serp_features: [],
          };
        });
      } catch {
        return [];
      }
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
      const url = `${BASE_URL}/?type=backlinks_overview&key=${this.apiKey}&target=${encodeURIComponent(domain)}&target_type=root_domain&export_columns=total,domains_num`;
      try {
        const text = await this.fetchJson<string>(url);
        const lines = String(text).split('\n').filter(Boolean);
        if (lines.length > 1) {
          const parts = lines[1].split(';');
          return {
            domain,
            referring_domains: parseInt(parts[1], 10) || 0,
            total_backlinks: parseInt(parts[0], 10) || 0,
            domain_authority: 0,
            page_authority: 0,
            spam_score: 0,
            dofollow_count: 0,
            nofollow_count: 0,
            top_links: [],
          };
        }
      } catch {
        // fallthrough
      }
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
    });
  }

  async getCompetitors(domain: string): Promise<CompetitorData[]> {
    if (!this.isConfigured()) return [];

    return this.schedule(async () => {
      const url = `${BASE_URL}/?type=domain_organic_organic&key=${this.apiKey}&domain=${encodeURIComponent(domain)}&display_limit=10&export_columns=Dn,Np,Or,Ot`;
      try {
        const text = await this.fetchJson<string>(url);
        const lines = String(text).split('\n').filter(Boolean);
        return lines.slice(1).map((line) => {
          const parts = line.split(';');
          return {
            domain: parts[0] || '',
            shared_keywords: parseInt(parts[1], 10) || 0,
            competitor_keywords: parseInt(parts[2], 10) || 0,
            visibility_score: parseFloat(parts[3]) || 0,
          };
        });
      } catch {
        return [];
      }
    });
  }
}
