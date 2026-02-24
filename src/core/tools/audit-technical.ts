// ---------------------------------------------------------------------------
// audit-technical.ts -- Technical SEO audit tool
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { auditHtml, calculateTechScore } from '../analysis/technical-auditor.js';
import { createTechnicalAudit } from '../db/technical-audits.js';
import { extractDomain } from '../utils/url.js';
import { log } from '../utils/logger.js';

export function createAuditTechnicalTool(_deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_audit_technical',
    description: 'Run a technical SEO audit on a URL: checks meta tags, headings, images, links, structured data, mobile-friendliness, and returns a score with recommendations.',
    params: {
      url: { type: 'string', required: true, description: 'URL to audit' },
    },
    execute: async (params: { url: string }): Promise<string> => {
      try {
        const { url } = params;
        const domain = extractDomain(url);
        log.info(`Running technical audit for: ${url}`);

        // Fetch the page
        let html = '';
        try {
          const response = await fetch(url, {
            headers: { 'User-Agent': 'LucidSEO-Auditor/1.0' },
          });
          html = await response.text();
        } catch (fetchErr) {
          return `Failed to fetch ${url}: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`;
        }

        const issues = auditHtml(html, url);
        const score = calculateTechScore(issues);

        // Count issue types
        const criticalCount = issues.filter((i) => i.severity === 'critical').length;
        const warningCount = issues.filter((i) => i.severity === 'warning').length;
        const infoCount = issues.filter((i) => i.severity === 'info').length;

        // Store audit
        await createTechnicalAudit({
          domain,
          issues,
          pages_crawled: 1,
          healthy_pages: criticalCount === 0 ? 1 : 0,
          broken_links: 0,
          redirect_chains: 0,
          missing_meta: issues.filter((i) => i.category === 'meta' && i.severity === 'critical').length,
          slow_pages: 0,
          mobile_issues: issues.filter((i) => i.category === 'mobile').length,
          schema_errors: issues.filter((i) => i.category === 'schema').length,
          score,
        }).catch((err) => log.warn('Failed to store technical audit:', err));

        const lines: string[] = [
          `## Technical SEO Audit: ${url}`,
          '',
          `### Score: ${score}/100`,
          '',
          `- **Critical Issues**: ${criticalCount}`,
          `- **Warnings**: ${warningCount}`,
          `- **Info**: ${infoCount}`,
          '',
        ];

        if (issues.length > 0) {
          lines.push('### Issues');
          for (const issue of issues) {
            const icon =
              issue.severity === 'critical' ? '[CRITICAL]' :
              issue.severity === 'warning' ? '[WARNING]' :
              issue.severity === 'info' ? '[INFO]' : '[PASS]';
            lines.push(`- **${icon}** [${issue.category}] ${issue.message}`);
          }
        } else {
          lines.push('### No issues found!');
        }

        lines.push('', '### Recommendations');
        if (criticalCount > 0) {
          lines.push('1. Fix all critical issues immediately (meta tags, mobile viewport)');
        }
        if (warningCount > 0) {
          lines.push('2. Address warnings to improve overall health');
        }
        lines.push('3. Run this audit regularly to catch regressions');

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_audit_technical failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
