// ---------------------------------------------------------------------------
// get-content-brief.ts -- Generate AI-ready content brief
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { CONTENT_TYPES } from '../types/common.js';
import { classifyIntent, suggestRelatedKeywords } from '../analysis/keyword-analyzer.js';
import { buildContentBriefPrompt } from '../analysis/prompts.js';
import { log } from '../utils/logger.js';

export function createGetContentBriefTool(deps: {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}): ToolDefinition {
  return {
    name: 'seo_get_content_brief',
    description: 'Generate a comprehensive content brief for a keyword, including SERP analysis, recommended structure, target word count, and optimization tips.',
    params: {
      keyword: { type: 'string', required: true, description: 'Target keyword' },
      content_type: {
        type: 'enum',
        required: false,
        values: [...CONTENT_TYPES],
        description: 'Type of content (default: blog_post)',
      },
    },
    execute: async (params: { keyword: string; content_type?: string }): Promise<string> => {
      try {
        const { keyword, content_type = 'blog_post' } = params;
        log.info(`Generating content brief for: "${keyword}" (${content_type})`);

        const intent = classifyIntent(keyword);
        const relatedKeywords = suggestRelatedKeywords(keyword);

        // Fetch SERP data if available
        const serpProvider = deps.providerRegistry.getSerpProvider();
        const serpResults = serpProvider
          ? await serpProvider.getSerpResults!(keyword)
          : [];

        const serpData = serpResults.slice(0, 5).map((r) => ({
          title: r.title,
          description: r.description,
          url: r.url,
        }));

        // Build the AI prompt (available for downstream AI processing)
        const aiPrompt = buildContentBriefPrompt(keyword, serpData, content_type);
        void aiPrompt;

        // Word count recommendations by content type
        const wordCounts: Record<string, string> = {
          blog_post: '1,500 - 2,500',
          landing_page: '500 - 1,000',
          product_page: '300 - 800',
          category_page: '500 - 1,000',
          guide: '3,000 - 5,000',
          faq: '1,000 - 2,000',
        };

        const lines: string[] = [
          `## Content Brief: "${keyword}"`,
          '',
          '### Overview',
          `- **Content Type**: ${content_type.replace(/_/g, ' ')}`,
          `- **Search Intent**: ${intent}`,
          `- **Target Word Count**: ${wordCounts[content_type] ?? '1,500 - 2,500'} words`,
          '',
          '### Recommended Title',
          `Include "${keyword}" in the first 60 characters. Example:`,
          `"The Ultimate Guide to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} (${new Date().getFullYear()})"`,
          '',
          '### Meta Description',
          `Write 150-160 chars including "${keyword}" and a compelling CTA.`,
          '',
          '### Heading Structure',
          `- **H1**: Include "${keyword}" naturally`,
          `- **H2s**: Cover subtopics:`,
          ...relatedKeywords.slice(0, 5).map((rk) => `  - ${rk}`),
          '',
        ];

        if (serpResults.length > 0) {
          lines.push('### Current SERP Landscape');
          for (const r of serpResults.slice(0, 5)) {
            lines.push(`${r.position}. **${r.title || '(no title)'}**`);
            lines.push(`   ${r.url}`);
          }
          lines.push('');
        }

        lines.push(
          '### Key Topics to Cover',
          '- Definition and overview',
          '- Benefits and use cases',
          '- Step-by-step instructions',
          '- Common mistakes to avoid',
          '- Expert tips and best practices',
          '- FAQ section',
          '',
          '### Optimization Checklist',
          `- [ ] Keyword "${keyword}" in title, H1, and first paragraph`,
          '- [ ] Related keywords used naturally throughout',
          '- [ ] Internal links to relevant pages',
          '- [ ] External links to authoritative sources',
          '- [ ] Images with descriptive alt text',
          '- [ ] Schema markup (FAQ, HowTo, or Article)',
          '- [ ] Mobile-friendly layout',
        );

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('seo_get_content_brief failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
