// ---------------------------------------------------------------------------
// track-rankings.ts -- Track keyword rankings for a domain
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { COUNTRIES } from '../types/common.js';
import { classifyIntent, calculateDifficultyScore } from '../analysis/keyword-analyzer.js';
import { upsertKeyword } from '../db/keywords.js';
import { log } from '../utils/logger.js';

export function createTrackRankingsTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_track_rankings',
    description: 'Track keyword rankings for a domain. Shows current positions, changes, and ranking trends.',
    params: {
      keywords: {
        type: 'array',
        required: true,
        items: { type: 'string' },
        description: 'Keywords to track',
      },
      domain: { type: 'string', required: true, description: 'Your domain to track rankings for' },
      country: {
        type: 'enum',
        required: false,
        values: [...COUNTRIES],
        description: 'Target country (default: us)',
      },
    },
    execute: async (params: { keywords: string[]; domain: string; country?: string }): Promise<string> => {
      try {
        const { keywords, domain, country } = params;
        log.info(`Tracking ${keywords.length} keywords for ${domain}`);

        const provider = deps.providerRegistry.getSerpProvider();

        const lines: string[] = [
          `## Ranking Tracker: ${domain}`,
          `- **Keywords tracked**: ${keywords.length}`,
          `- **Country**: ${country ?? 'us'}`,
          '',
          '| Keyword | Position | Intent | Difficulty |',
          '|---------|----------|--------|------------|',
        ];

        for (const kw of keywords) {
          let position: number | null = null;
          let rankUrl: string | null = null;

          if (provider) {
            const serpResults = await provider.getSerpResults!(kw, country as any);
            const match = serpResults.find(
              (r) => r.domain.toLowerCase().includes(domain.toLowerCase()) || r.url.toLowerCase().includes(domain.toLowerCase()),
            );
            if (match) {
              position = match.position;
              rankUrl = match.url;
            }
          }

          const intent = classifyIntent(kw);
          const difficulty = calculateDifficultyScore(0.5, 1000);

          // Store keyword tracking data
          await upsertKeyword({
            keyword: kw.toLowerCase(),
            search_volume: 0,
            cpc: 0,
            competition: 0.5,
            difficulty,
            intent,
            current_rank: position,
            url: rankUrl,
            tracked_at: new Date().toISOString(),
          }).catch((err) => log.warn('Failed to store keyword rank:', err));

          const posStr = position ? `#${position}` : 'Not ranked';
          lines.push(`| ${kw} | ${posStr} | ${intent} | ${difficulty}/100 |`);
        }

        if (!provider) {
          lines.push('', '*No SERP provider configured. Rankings shown as "Not ranked". Configure SerpAPI for live data.*');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_track_rankings failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
