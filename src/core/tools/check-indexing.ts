// ---------------------------------------------------------------------------
// check-indexing.ts -- Check indexing status
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { log } from '../utils/logger.js';

export function createCheckIndexingTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_check_indexing',
    description: 'Check indexing status of a domain or specific URLs. Reports which pages are indexed and potential indexing issues.',
    params: {
      domain: { type: 'string', required: true, description: 'Domain to check indexing for' },
      urls: {
        type: 'array',
        required: false,
        items: { type: 'string' },
        description: 'Specific URLs to check (optional)',
      },
    },
    execute: async (params: { domain: string; urls?: string[] }): Promise<string> => {
      try {
        const { domain, urls = [] } = params;
        log.info(`Checking indexing for: ${domain}`);

        const serpProvider = deps.providerRegistry.getSerpProvider();

        const lines: string[] = [
          `## Indexing Status: ${domain}`,
          '',
        ];

        if (serpProvider) {
          // Check site: query
          const siteResults = await serpProvider.getSerpResults!(`site:${domain}`);
          lines.push(`### Site Index Status`);
          lines.push(`- **Indexed pages found**: ${siteResults.length > 0 ? siteResults.length + '+' : '0'}`);
          lines.push('');

          if (urls.length > 0) {
            lines.push('### URL-Level Status');
            for (const url of urls.slice(0, 10)) {
              const urlResults = await serpProvider.getSerpResults!(`site:${url}`);
              const indexed = urlResults.length > 0;
              lines.push(`- ${url}: ${indexed ? 'Indexed' : 'Not indexed'}`);
            }
          }
        } else {
          lines.push('*No SERP provider configured. Configure SerpAPI for indexing checks.*');
        }

        lines.push(
          '',
          '### Indexing Tips',
          '- Submit sitemap to Google Search Console',
          '- Ensure robots.txt allows crawling of important pages',
          '- Check for noindex meta tags on pages that should be indexed',
          '- Use internal linking to help crawlers discover pages',
          '- Fix any crawl errors in Search Console',
        );

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_check_indexing failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
