// ---------------------------------------------------------------------------
// analyze-serp.ts -- SERP analysis tool
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { COUNTRIES } from '../types/common.js';
import { log } from '../utils/logger.js';

export function createAnalyzeSerpTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_analyze_serp',
    description: 'Analyze the SERP (Search Engine Results Page) for a keyword, returning top 10 results with positions, titles, descriptions, and SERP features.',
    params: {
      keyword: { type: 'string', required: true, description: 'Keyword to analyze SERP for' },
      country: {
        type: 'enum',
        required: false,
        values: [...COUNTRIES],
        description: 'Target country (default: us)',
      },
    },
    execute: async (params: { keyword: string; country?: string }): Promise<string> => {
      try {
        const { keyword, country } = params;
        log.info(`Analyzing SERP for: "${keyword}"`);

        const provider = deps.providerRegistry.getSerpProvider();
        const results = provider
          ? await provider.getSerpResults!(keyword, country as any)
          : [];

        if (results.length === 0) {
          return `No SERP data available for "${keyword}". Configure SerpAPI or SEMrush for live SERP data.`;
        }

        const lines: string[] = [
          `## SERP Analysis: "${keyword}"`,
          `- **Results found**: ${results.length}`,
          '',
        ];

        for (const r of results) {
          lines.push(`### #${r.position}: ${r.title || '(no title)'}`);
          lines.push(`- **URL**: ${r.url}`);
          lines.push(`- **Domain**: ${r.domain}`);
          if (r.description) lines.push(`- **Snippet**: ${r.description}`);
          if (r.serp_features.length > 0) lines.push(`- **SERP Features**: ${r.serp_features.join(', ')}`);
          lines.push('');
        }

        if (provider) {
          lines.push(`*Data source: ${provider.name}*`);
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_analyze_serp failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
