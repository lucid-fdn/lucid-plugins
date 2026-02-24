// ---------------------------------------------------------------------------
// optimize-content.ts -- Content optimization tool
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { analyzeContent } from '../analysis/content-optimizer.js';
import { createContentAnalysis } from '../db/content-analyses.js';
import { stripHtml, countWords } from '../utils/text.js';
import { log } from '../utils/logger.js';

export function createOptimizeContentTool(_deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_optimize_content',
    description: 'Analyze and optimize content for SEO: readability score, keyword density, heading structure, meta tags, and actionable suggestions.',
    params: {
      url: { type: 'string', required: false, description: 'URL to fetch and analyze (optional if content provided)' },
      content: { type: 'string', required: false, description: 'HTML or text content to analyze' },
      target_keyword: { type: 'string', required: true, description: 'Target keyword to optimize for' },
    },
    execute: async (params: { url?: string; content?: string; target_keyword: string }): Promise<string> => {
      try {
        const { url, content: rawContent, target_keyword } = params;
        log.info(`Optimizing content for keyword: "${target_keyword}"`);

        let html = rawContent ?? '';

        if (url && !rawContent) {
          try {
            const response = await fetch(url, {
              headers: { 'User-Agent': 'LucidSEO-Optimizer/1.0' },
            });
            html = await response.text();
          } catch (fetchErr) {
            return `Failed to fetch ${url}: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`;
          }
        }

        if (!html) {
          return 'No content provided. Pass either a URL or content string.';
        }

        const analysis = analyzeContent(html, target_keyword);
        const plain = stripHtml(html);
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);

        // Store analysis
        await createContentAnalysis({
          url: url ?? 'inline-content',
          title: titleMatch?.[1] ?? '',
          word_count: countWords(plain),
          readability_score: analysis.readability,
          keyword_density: analysis.keyword_density,
          heading_structure: { heading_score: analysis.heading_score },
          meta_description: metaDescMatch?.[1] ?? '',
          meta_title: titleMatch?.[1] ?? '',
          score: analysis.overall,
          suggestions: { items: analysis.suggestions },
        }).catch((err) => log.warn('Failed to store content analysis:', err));

        const lines: string[] = [
          `## Content Optimization: "${target_keyword}"`,
          url ? `**URL**: ${url}` : '**Source**: Inline content',
          '',
          `### Score: ${analysis.overall}/100`,
          '',
          '### Metrics',
          `- **Word Count**: ${analysis.word_count}`,
          `- **Readability**: ${analysis.readability}/100`,
          `- **Keyword Density**: ${analysis.keyword_density.toFixed(1)}%`,
          `- **Heading Score**: ${analysis.heading_score}/100`,
          `- **Meta Title**: ${analysis.has_meta_title ? 'Present' : 'Missing'}`,
          `- **Meta Description**: ${analysis.has_meta_description ? 'Present' : 'Missing'}`,
        ];

        if (analysis.suggestions.length > 0) {
          lines.push('', '### Suggestions');
          for (const s of analysis.suggestions) {
            lines.push(`- ${s}`);
          }
        } else {
          lines.push('', '### Content looks well-optimized!');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_optimize_content failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
