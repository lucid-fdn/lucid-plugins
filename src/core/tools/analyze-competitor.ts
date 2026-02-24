// ---------------------------------------------------------------------------
// analyze-competitor.ts -- Competitor analysis tool
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { analyzeOverlap, compareVisibility } from '../analysis/competitor-analyzer.js';
import { createCompetitorTrack } from '../db/competitors.js';
import { log } from '../utils/logger.js';

export function createAnalyzeCompetitorTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_analyze_competitor',
    description: 'Compare your domain against a competitor: keyword overlap, content gaps, authority comparison, and visibility differences.',
    params: {
      competitor_domain: { type: 'string', required: true, description: 'Competitor domain to analyze' },
      our_domain: { type: 'string', required: true, description: 'Your domain for comparison' },
    },
    execute: async (params: { competitor_domain: string; our_domain: string }): Promise<string> => {
      try {
        const { competitor_domain, our_domain } = params;
        log.info(`Analyzing competitor: ${competitor_domain} vs ${our_domain}`);

        const backlinkProvider = deps.providerRegistry.getBacklinkProvider();
        const authorityProvider = deps.providerRegistry.getAuthorityProvider();
        const keywordProvider = deps.providerRegistry.getKeywordProvider();

        // Get authority data for both
        let ourAuthority = 0;
        let compAuthority = 0;

        if (authorityProvider) {
          const [ourDA, compDA] = await Promise.all([
            authorityProvider.getDomainAuthority!(our_domain),
            authorityProvider.getDomainAuthority!(competitor_domain),
          ]);
          ourAuthority = ourDA.domain_authority;
          compAuthority = compDA.domain_authority;
        }

        // Get backlink data
        let ourBacklinks = 0;
        let compBacklinks = 0;

        if (backlinkProvider) {
          const [ourBL, compBL] = await Promise.all([
            backlinkProvider.getBacklinks!(our_domain),
            backlinkProvider.getBacklinks!(competitor_domain),
          ]);
          ourBacklinks = ourBL.total_backlinks;
          compBacklinks = compBL.total_backlinks;
        }

        // Get keyword overlap estimate via competitors API
        let sharedKeywords = 0;
        let competitorKeywords = 0;
        let ourKeywords = 0;

        if (keywordProvider?.getCompetitors) {
          const competitors = await keywordProvider.getCompetitors(our_domain);
          const compData = competitors.find((c) => c.domain.toLowerCase().includes(competitor_domain.toLowerCase()));
          if (compData) {
            sharedKeywords = compData.shared_keywords;
            competitorKeywords = compData.competitor_keywords;
          }
        }

        const overlap = analyzeOverlap(
          Array(ourKeywords).fill(''),
          Array(competitorKeywords).fill(''),
        );
        overlap.competitor_domain = competitor_domain;
        overlap.our_domain = our_domain;
        overlap.shared_keywords = sharedKeywords;

        const totalUnique = sharedKeywords + (competitorKeywords - sharedKeywords) + (ourKeywords - sharedKeywords);
        const overlapPct = totalUnique > 0 ? (sharedKeywords / totalUnique) * 100 : 0;

        const visibility = compareVisibility(our_domain, competitor_domain, ourAuthority, compAuthority);

        // Store
        await createCompetitorTrack({
          domain: competitor_domain.toLowerCase(),
          our_domain: our_domain.toLowerCase(),
          shared_keywords: sharedKeywords,
          competitor_keywords: competitorKeywords,
          our_keywords: ourKeywords,
          overlap_pct: Math.round(overlapPct * 100) / 100,
          visibility_score: compAuthority,
        }).catch((err) => log.warn('Failed to store competitor track:', err));

        const lines: string[] = [
          `## Competitor Analysis: ${competitor_domain} vs ${our_domain}`,
          '',
          '### Authority Comparison',
          `| Metric | ${our_domain} | ${competitor_domain} |`,
          '|--------|' + '-'.repeat(our_domain.length + 2) + '|' + '-'.repeat(competitor_domain.length + 2) + '|',
          `| Domain Authority | ${ourAuthority} | ${compAuthority} |`,
          `| Total Backlinks | ${ourBacklinks.toLocaleString()} | ${compBacklinks.toLocaleString()} |`,
          '',
          '### Keyword Overlap',
          `- **Shared Keywords**: ${sharedKeywords}`,
          `- **Competitor-Only Keywords**: ${competitorKeywords - sharedKeywords}`,
          `- **Overlap**: ${overlapPct.toFixed(1)}%`,
          '',
          '### Visibility',
          `- **Your Visibility**: ${visibility.our_visibility}`,
          `- **Competitor Visibility**: ${visibility.competitor_visibility}`,
          `- **Difference**: ${visibility.difference > 0 ? '+' : ''}${visibility.difference}`,
        ];

        const hasProviders = authorityProvider || backlinkProvider || keywordProvider;
        if (!hasProviders) {
          lines.push('', '*No SEO providers configured. Configure SEMrush, Ahrefs, or Moz for detailed analysis.*');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_analyze_competitor failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
