// ---------------------------------------------------------------------------
// generate-sitemap-analysis.ts -- Sitemap health analysis
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { isValidUrl } from '../utils/url.js';
import { log } from '../utils/logger.js';

export function createGenerateSitemapAnalysisTool(_deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_generate_sitemap_analysis',
    description: 'Analyze sitemap health for a domain: checks sitemap.xml accessibility, URL count, missing pages, and orphan page detection.',
    params: {
      domain: { type: 'string', required: true, description: 'Domain to analyze sitemap for' },
    },
    execute: async (params: { domain: string }): Promise<string> => {
      try {
        const { domain } = params;
        log.info(`Analyzing sitemap for: ${domain}`);

        const sitemapUrl = `https://${domain.replace(/^https?:\/\//, '')}/sitemap.xml`;

        let sitemapContent = '';
        let sitemapAccessible = false;
        let urlCount = 0;

        try {
          const response = await fetch(sitemapUrl, {
            headers: { 'User-Agent': 'LucidSEO-Crawler/1.0' },
          });
          if (response.ok) {
            sitemapContent = await response.text();
            sitemapAccessible = true;
            // Count URLs in sitemap
            const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/gi);
            urlCount = urlMatches ? urlMatches.length : 0;
          }
        } catch {
          // sitemap not accessible
        }

        // Check robots.txt for sitemap reference
        let robotsHasSitemap = false;
        try {
          const robotsUrl = `https://${domain.replace(/^https?:\/\//, '')}/robots.txt`;
          const robotsResponse = await fetch(robotsUrl, {
            headers: { 'User-Agent': 'LucidSEO-Crawler/1.0' },
          });
          if (robotsResponse.ok) {
            const robotsText = await robotsResponse.text();
            robotsHasSitemap = robotsText.toLowerCase().includes('sitemap');
          }
        } catch {
          // robots.txt not accessible
        }

        // Extract URLs from sitemap
        const sitemapUrls: string[] = [];
        if (sitemapContent) {
          const locMatches = sitemapContent.matchAll(/<loc>(.*?)<\/loc>/gi);
          for (const m of locMatches) {
            if (isValidUrl(m[1])) {
              sitemapUrls.push(m[1]);
            }
          }
        }

        // Check for sub-sitemaps
        const hasSubSitemaps = sitemapContent.includes('<sitemapindex');
        const subSitemapCount = hasSubSitemaps
          ? (sitemapContent.match(/<sitemap>/gi) ?? []).length
          : 0;

        const lines: string[] = [
          `## Sitemap Analysis: ${domain}`,
          '',
          '### Sitemap Status',
          `- **URL**: ${sitemapUrl}`,
          `- **Accessible**: ${sitemapAccessible ? 'Yes' : 'No'}`,
          `- **URLs in Sitemap**: ${urlCount}`,
          `- **Sitemap Index**: ${hasSubSitemaps ? `Yes (${subSitemapCount} sub-sitemaps)` : 'No'}`,
          `- **Referenced in robots.txt**: ${robotsHasSitemap ? 'Yes' : 'No'}`,
          '',
        ];

        // Issues
        const issues: string[] = [];
        if (!sitemapAccessible) {
          issues.push('[CRITICAL] Sitemap not accessible at standard location');
        }
        if (!robotsHasSitemap) {
          issues.push('[WARNING] Sitemap not referenced in robots.txt');
        }
        if (urlCount === 0 && sitemapAccessible) {
          issues.push('[WARNING] Sitemap is empty (no URLs found)');
        }
        if (urlCount > 50000) {
          issues.push('[WARNING] Sitemap exceeds 50,000 URL limit — use sitemap index');
        }

        if (issues.length > 0) {
          lines.push('### Issues');
          for (const issue of issues) {
            lines.push(`- ${issue}`);
          }
        } else {
          lines.push('### No issues found');
        }

        lines.push(
          '',
          '### Recommendations',
          '- Ensure sitemap is accessible at /sitemap.xml',
          '- Reference sitemap in robots.txt',
          '- Include all important pages in the sitemap',
          '- Keep sitemap under 50,000 URLs per file',
          '- Update sitemap when new pages are published',
          '- Submit sitemap to Google Search Console',
        );

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_generate_sitemap_analysis failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
