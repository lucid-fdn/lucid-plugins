// ---------------------------------------------------------------------------
// optimize-content.ts -- Content optimization suggestions per platform
// ---------------------------------------------------------------------------

import type { ToolDefinition } from './types.js';
import type { ToolDependencies } from './index.js';
import { PLATFORMS, CONTENT_TYPES } from '../types/common.js';
import { optimizeContent } from '../analysis/content-optimizer.js';
import { log } from '../utils/logger.js';

export function createOptimizeContentTool(_deps: ToolDependencies): ToolDefinition {
  return {
    name: 'hype_optimize_content',
    description:
      'Analyze content and provide optimization suggestions for a specific platform. Scores length, hashtags, readability, CTA, and more.',
    params: {
      text: { type: 'string', required: true, description: 'Content text to optimize' },
      platform: {
        type: 'enum',
        required: true,
        values: [...PLATFORMS],
        description: 'Target platform',
      },
      content_type: {
        type: 'enum',
        required: false,
        values: [...CONTENT_TYPES],
        description: 'Content type',
      },
      target_audience: {
        type: 'string',
        required: false,
        description: 'Target audience description',
      },
    },
    execute: async (params: Record<string, unknown>): Promise<string> => {
      try {
        const result = optimizeContent({
          text: params.text as string,
          platform: params.platform as any,
          contentType: params.content_type as any,
          targetAudience: params.target_audience as string,
        });

        const lines = [
          `## Content Optimization: ${result.platform}`,
          '',
          `- **Overall Score**: ${result.overallScore}/100`,
          `- **Optimal Length**: ${result.optimalLength} characters`,
          `- **Recommended Format**: ${result.recommendedFormat}`,
          '',
        ];

        if (result.recommendedHashtags.length > 0) {
          lines.push('### Recommended Hashtags');
          lines.push(result.recommendedHashtags.join(' '));
          lines.push('');
        }

        if (result.suggestions.length > 0) {
          lines.push('### Suggestions');
          for (const s of result.suggestions) {
            lines.push(`#### ${s.area} (impact: ${s.impact}/100)`);
            lines.push(`- Current: ${s.current}`);
            lines.push(`- Recommended: ${s.recommended}`);
            lines.push('');
          }
        } else {
          lines.push('### No suggestions -- content looks good!');
        }

        return lines.join('\n');
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('hype_optimize_content failed', msg);
        return `Error: ${msg}`;
      }
    },
  };
}
