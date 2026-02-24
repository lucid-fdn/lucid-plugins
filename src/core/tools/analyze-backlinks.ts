// ---------------------------------------------------------------------------
// analyze-backlinks.ts -- Backlink analysis tool
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { upsertBacklinkProfile } from '../db/backlinks.js';
import { log } from '../utils/logger.js';

export function createAnalyzeBacklinksTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_analyze_backlinks',
    description: 'Analyze the backlink profile of a domain: referring domains, total backlinks, authority scores, spam score, and top linking pages.',
    params: {
      domain: { type: 'string', required: true, description: 'Domain to analyze backlinks for' },
    },
    execute: async (params: { domain: string }): Promise<string> => {
      try {
        const { domain } = params;
        log.info(`Analyzing backlinks for: ${domain}`);

        const backlinkProvider = deps.providerRegistry.getBacklinkProvider();
        const authorityProvider = deps.providerRegistry.getAuthorityProvider();

        let backlinkData = backlinkProvider
          ? await backlinkProvider.getBacklinks!(domain)
          : null;

        const authorityData = authorityProvider
          ? await authorityProvider.getDomainAuthority!(domain)
          : null;

        if (!backlinkData && !authorityData) {
          return `No backlink data available for ${domain}. Configure SEMrush, Ahrefs, or Moz for backlink analysis.`;
        }

        if (!backlinkData) {
          backlinkData = {
            domain,
            referring_domains: 0,
            total_backlinks: 0,
            domain_authority: authorityData?.domain_authority ?? 0,
            page_authority: authorityData?.page_authority ?? 0,
            spam_score: authorityData?.spam_score ?? 0,
            dofollow_count: 0,
            nofollow_count: 0,
            top_links: [],
          };
        }

        if (authorityData) {
          backlinkData.domain_authority = authorityData.domain_authority;
          backlinkData.page_authority = authorityData.page_authority;
          backlinkData.spam_score = authorityData.spam_score;
        }

        // Store in DB
        await upsertBacklinkProfile({
          domain: domain.toLowerCase(),
          referring_domains: backlinkData.referring_domains,
          total_backlinks: backlinkData.total_backlinks,
          domain_authority: backlinkData.domain_authority,
          page_authority: backlinkData.page_authority,
          spam_score: backlinkData.spam_score,
          dofollow_count: backlinkData.dofollow_count,
          nofollow_count: backlinkData.nofollow_count,
        }).catch((err) => log.warn('Failed to store backlink profile:', err));

        const lines: string[] = [
          `## Backlink Profile: ${domain}`,
          '',
          '### Authority',
          `- **Domain Authority**: ${backlinkData.domain_authority}/100`,
          `- **Page Authority**: ${backlinkData.page_authority}/100`,
          `- **Spam Score**: ${backlinkData.spam_score}%`,
          '',
          '### Backlinks',
          `- **Total Backlinks**: ${backlinkData.total_backlinks.toLocaleString()}`,
          `- **Referring Domains**: ${backlinkData.referring_domains.toLocaleString()}`,
          `- **Dofollow**: ${backlinkData.dofollow_count.toLocaleString()}`,
          `- **Nofollow**: ${backlinkData.nofollow_count.toLocaleString()}`,
        ];

        if (backlinkData.top_links.length > 0) {
          lines.push('', '### Top Links');
          for (const link of backlinkData.top_links.slice(0, 10)) {
            lines.push(`- **${link.source_domain}** -> [${link.anchor_text || '(no anchor)'}] (${link.link_type})`);
          }
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_analyze_backlinks failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
