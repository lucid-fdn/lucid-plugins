// ---------------------------------------------------------------------------
// find-content-gaps.ts -- Find keywords competitors rank for but you don't
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { calculateOpportunityScore } from '../analysis/competitor-analyzer.js';
import { log } from '../utils/logger.js';

export function createFindContentGapsTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_find_content_gaps',
    description: 'Discover content gaps: keywords your competitors rank for but your domain does not. Returns prioritized list with opportunity scores.',
    params: {
      domain: { type: 'string', required: true, description: 'Your domain' },
      competitors: {
        type: 'array',
        required: true,
        items: { type: 'string' },
        description: 'Competitor domains to analyze',
      },
    },
    execute: async (params: { domain: string; competitors: string[] }): Promise<string> => {
      try {
        const { domain, competitors } = params;
        log.info(`Finding content gaps for ${domain} vs ${competitors.length} competitors`);

        const keywordProvider = deps.providerRegistry.getKeywordProvider();

        if (!keywordProvider?.getCompetitors) {
          return `Content gap analysis requires an SEO provider with competitor data. Configure SEMrush or Ahrefs.`;
        }

        // Get competitor data
        const competitorResults = await keywordProvider.getCompetitors(domain);

        const matchedCompetitors = competitors
          .map((c) => {
            const match = competitorResults.find((cr) =>
              cr.domain.toLowerCase().includes(c.toLowerCase()),
            );
            return match ? { input: c, data: match } : null;
          })
          .filter(Boolean) as Array<{ input: string; data: { domain: string; shared_keywords: number; competitor_keywords: number; visibility_score: number } }>;

        const lines: string[] = [
          `## Content Gaps: ${domain}`,
          '',
          `Analyzed ${competitors.length} competitor(s)`,
          '',
        ];

        if (matchedCompetitors.length > 0) {
          lines.push('### Competitor Coverage');
          for (const mc of matchedCompetitors) {
            const gapKeywords = mc.data.competitor_keywords - mc.data.shared_keywords;
            const opportunityScore = calculateOpportunityScore(gapKeywords * 100, 50, 1);
            lines.push(
              `- **${mc.data.domain}**: ${gapKeywords} unique keywords (opportunity: ${opportunityScore}/100)`,
            );
          }
        } else {
          lines.push('### No direct competitor data found');
          lines.push('');
          lines.push('The specified competitors were not found in the provider data.');
        }

        lines.push(
          '',
          '### Recommended Actions',
          '1. Create content targeting high-volume competitor keywords',
          '2. Focus on commercial-intent keywords with low difficulty',
          '3. Build topic clusters around content gap themes',
          '4. Analyze top-ranking competitor pages for content structure',
          '5. Prioritize keywords with high CPC (commercial value)',
        );

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_find_content_gaps failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
