// ---------------------------------------------------------------------------
// get-domain-overview.ts -- Domain overview: authority, backlinks, traffic
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { log } from '../utils/logger.js';

export function createGetDomainOverviewTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_get_domain_overview',
    description: 'Get a comprehensive domain overview: domain authority, backlinks, estimated organic traffic, top keywords, and competitive position.',
    params: {
      domain: { type: 'string', required: true, description: 'Domain to analyze' },
    },
    execute: async (params: { domain: string }): Promise<string> => {
      try {
        const { domain } = params;
        log.info(`Getting domain overview for: ${domain}`);

        const authorityProvider = deps.providerRegistry.getAuthorityProvider();
        const backlinkProvider = deps.providerRegistry.getBacklinkProvider();
        const keywordProvider = deps.providerRegistry.getKeywordProvider();

        const lines: string[] = [
          `## Domain Overview: ${domain}`,
          '',
        ];

        // Authority data
        if (authorityProvider) {
          const authority = await authorityProvider.getDomainAuthority!(domain);
          lines.push('### Authority');
          lines.push(`- **Domain Authority**: ${authority.domain_authority}/100`);
          lines.push(`- **Page Authority**: ${authority.page_authority}/100`);
          lines.push(`- **Spam Score**: ${authority.spam_score}%`);
          lines.push(`- **Linking Root Domains**: ${authority.linking_root_domains.toLocaleString()}`);
          lines.push('');
        }

        // Backlink data
        if (backlinkProvider) {
          const backlinks = await backlinkProvider.getBacklinks!(domain);
          lines.push('### Backlinks');
          lines.push(`- **Total Backlinks**: ${backlinks.total_backlinks.toLocaleString()}`);
          lines.push(`- **Referring Domains**: ${backlinks.referring_domains.toLocaleString()}`);
          lines.push(`- **Dofollow**: ${backlinks.dofollow_count.toLocaleString()}`);
          lines.push(`- **Nofollow**: ${backlinks.nofollow_count.toLocaleString()}`);
          lines.push('');
        }

        // Competitor data
        if (keywordProvider?.getCompetitors) {
          const competitors = await keywordProvider.getCompetitors(domain);
          if (competitors.length > 0) {
            lines.push('### Top Competitors');
            for (const c of competitors.slice(0, 5)) {
              lines.push(`- **${c.domain}**: ${c.shared_keywords} shared keywords, visibility ${c.visibility_score}`);
            }
            lines.push('');
          }
        }

        if (!authorityProvider && !backlinkProvider && !keywordProvider) {
          lines.push('*No SEO providers configured. Configure SEMrush, Ahrefs, or Moz for domain analysis.*');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_get_domain_overview failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
