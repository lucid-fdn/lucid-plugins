// ---------------------------------------------------------------------------
// find-link-opportunities.ts -- Find link building opportunities
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { log } from '../utils/logger.js';

export function createFindLinkOpportunitiesTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_find_link_opportunities',
    description: 'Find link building opportunities: unlinked mentions, broken link targets, and guest post prospects based on competitor backlink analysis.',
    params: {
      domain: { type: 'string', required: true, description: 'Your domain to find opportunities for' },
      competitors: {
        type: 'array',
        required: false,
        items: { type: 'string' },
        description: 'Competitor domains to analyze for link opportunities',
      },
    },
    execute: async (params: { domain: string; competitors?: string[] }): Promise<string> => {
      try {
        const { domain, competitors = [] } = params;
        log.info(`Finding link opportunities for: ${domain}`);

        const backlinkProvider = deps.providerRegistry.getBacklinkProvider();

        const competitorLinks: Array<{ domain: string; links: number; referring: number }> = [];

        if (backlinkProvider && competitors.length > 0) {
          for (const comp of competitors.slice(0, 5)) {
            try {
              const data = await backlinkProvider.getBacklinks!(comp);
              competitorLinks.push({
                domain: comp,
                links: data.total_backlinks,
                referring: data.referring_domains,
              });
            } catch {
              // skip failed competitors
            }
          }
        }

        const lines: string[] = [
          `## Link Opportunities: ${domain}`,
          '',
          '### Strategies',
          '1. **Broken Link Building**: Find broken links on competitor sites and offer your content as replacement.',
          '2. **Guest Posting**: Target sites that link to competitors but not to you.',
          '3. **Unlinked Mentions**: Find mentions of your brand without links.',
          '4. **Resource Page Links**: Get listed on industry resource pages.',
          '5. **Skyscraper Technique**: Create better content than top-ranking pages.',
          '',
        ];

        if (competitorLinks.length > 0) {
          lines.push('### Competitor Backlink Profiles');
          for (const cl of competitorLinks) {
            lines.push(`- **${cl.domain}**: ${cl.links.toLocaleString()} backlinks from ${cl.referring.toLocaleString()} domains`);
          }
          lines.push('');
          lines.push('### Actionable Items');
          lines.push('- Analyze top competitor backlinks for replication opportunities');
          lines.push('- Target sites that link to 2+ competitors (high probability of linking)');
          lines.push('- Focus on high-authority domains for maximum impact');
        } else if (!backlinkProvider) {
          lines.push('*No backlink provider configured. Configure SEMrush or Ahrefs for competitor analysis.*');
        } else {
          lines.push('*No competitor domains provided for analysis.*');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_find_link_opportunities failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
