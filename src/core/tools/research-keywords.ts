// ---------------------------------------------------------------------------
// research-keywords.ts -- Keyword research tool
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { COUNTRIES } from '../types/common.js';
import { classifyIntent, calculateDifficultyScore, suggestRelatedKeywords, calculateKeywordValue } from '../analysis/keyword-analyzer.js';
import { upsertKeyword } from '../db/keywords.js';
import { log } from '../utils/logger.js';

export function createResearchKeywordsTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_research_keywords',
    description:
      'Research keywords: get search volume, CPC, difficulty, intent classification, and related suggestions for a given keyword.',
    params: {
      keyword: { type: 'string', required: true, description: 'Keyword or phrase to research' },
      country: {
        type: 'enum',
        required: false,
        values: [...COUNTRIES],
        description: 'Target country (default: us)',
      },
      limit: {
        type: 'number',
        required: false,
        min: 1,
        max: 50,
        description: 'Max results (default: 10)',
      },
    },
    execute: async (params: { keyword: string; country?: string; limit?: number }): Promise<string> => {
      try {
        const { keyword, country, limit = 10 } = params;
        log.info(`Researching keyword: "${keyword}"`);

        const provider = deps.providerRegistry.getKeywordProvider();
        let keywordData = provider
          ? await provider.getKeywordData!([keyword], country as any)
          : [];

        // Fallback: generate mock data if no provider
        if (keywordData.length === 0) {
          keywordData = [
            {
              keyword,
              search_volume: 0,
              cpc: 0,
              competition: 0,
              difficulty: 50,
            },
          ];
        }

        const kd = keywordData[0];
        const intent = classifyIntent(keyword);
        const difficulty = calculateDifficultyScore(kd.competition, kd.search_volume);
        const value = calculateKeywordValue(kd.search_volume, kd.cpc);
        const suggestions = suggestRelatedKeywords(keyword).slice(0, limit);

        // Store in DB
        await upsertKeyword({
          keyword: keyword.toLowerCase(),
          search_volume: kd.search_volume,
          cpc: kd.cpc,
          competition: kd.competition,
          difficulty,
          intent,
          serp_features: [],
        }).catch((err) => log.warn('Failed to store keyword:', err));

        const lines: string[] = [
          `## Keyword Research: "${keyword}"`,
          '',
          `- **Search Volume**: ${kd.search_volume.toLocaleString()}/mo`,
          `- **CPC**: $${kd.cpc.toFixed(2)}`,
          `- **Competition**: ${(kd.competition * 100).toFixed(0)}%`,
          `- **Difficulty**: ${difficulty}/100`,
          `- **Intent**: ${intent}`,
          `- **Estimated Value**: $${value.toFixed(2)}/mo`,
          '',
          '### Related Keywords',
          ...suggestions.map((s) => `- ${s}`),
        ];

        if (provider) {
          lines.push('', `*Data source: ${provider.name}*`);
        } else {
          lines.push('', '*No SEO provider configured. Configure SEMrush or Ahrefs for live data.*');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_research_keywords failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
