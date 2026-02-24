// ---------------------------------------------------------------------------
// moz.ts -- Moz API provider
// ---------------------------------------------------------------------------

import { BaseProvider } from './base.js';
import type { PluginConfig } from '../types/config.js';
import type { DomainAuthorityData } from '../types/provider.js';
import { log } from '../utils/logger.js';

const BASE_URL = 'https://lsapi.seomoz.com/v2/url_metrics';

export class MozProvider extends BaseProvider {
  name = 'moz';
  private accessId: string | undefined;
  private secretKey: string | undefined;

  constructor(config: PluginConfig) {
    super({ maxConcurrent: 1, minTime: 1000 });
    this.accessId = config.mozAccessId;
    this.secretKey = config.mozSecretKey;
  }

  isConfigured(): boolean {
    return !!this.accessId && !!this.secretKey;
  }

  async getDomainAuthority(domain: string): Promise<DomainAuthorityData> {
    if (!this.isConfigured()) {
      return { domain, domain_authority: 0, page_authority: 0, spam_score: 0, linking_root_domains: 0 };
    }
    log.debug(`moz: fetching domain authority for ${domain}`);

    return this.schedule(async () => {
      try {
        const auth = Buffer.from(`${this.accessId}:${this.secretKey}`).toString('base64');
        const data = await this.fetchJson<{
          domain_authority?: number;
          page_authority?: number;
          spam_score?: number;
          root_domains_to_root_domain?: number;
        }>(BASE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            targets: [domain],
          }),
        });

        return {
          domain,
          domain_authority: data.domain_authority ?? 0,
          page_authority: data.page_authority ?? 0,
          spam_score: data.spam_score ?? 0,
          linking_root_domains: data.root_domains_to_root_domain ?? 0,
        };
      } catch (err) {
        log.warn(`moz: failed to fetch DA for ${domain}`, err);
        return { domain, domain_authority: 0, page_authority: 0, spam_score: 0, linking_root_domains: 0 };
      }
    });
  }
}
