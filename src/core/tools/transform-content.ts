import type { PluginConfig, ContentFormat, ContentTransformer } from '../types/index.js';
import { log } from '../utils/logger.js';
import type { ToolDefinition } from './types.js';

export interface TransformContentDeps {
  config: PluginConfig;
  transformerRegistry: Map<ContentFormat, ContentTransformer>;
}

export function createTransformContentTool(deps: TransformContentDeps): ToolDefinition {
  return {
    name: 'veille_transform_content' as const,
    description: 'Transform a digest into a specific content format (blog post, X thread, LinkedIn post, or newsletter). Returns prompt data for the agent LLM to produce the transformed content.',
    params: {
      digest_markdown: { type: 'string', required: true, description: 'Markdown content of the digest to transform' },
      digest_title: { type: 'string', required: true, description: 'Title of the digest' },
      format: { type: 'enum', values: ['blog_post', 'x_thread', 'linkedin_post', 'newsletter'], required: true, description: 'Target content format' },
    },
    execute: async (params: {
      digest_markdown: string;
      digest_title: string;
      format: ContentFormat;
    }): Promise<string> => {
      try {
        const { config, transformerRegistry } = deps;
        const transformer = transformerRegistry.get(params.format);

        if (!transformer) {
          return JSON.stringify({
            _action: 'transform_content',
            error: `No transformer registered for format "${params.format}". Available formats: ${[...transformerRegistry.keys()].join(', ')}`,
          }, null, 2);
        }

        log.info(`Transforming digest "${params.digest_title}" to ${params.format}`);

        const promptData = transformer.buildPrompt({
          digestMarkdown: params.digest_markdown,
          digestTitle: params.digest_title,
          format: params.format,
          language: config.language,
        });

        log.info(`Transform prompt built for format ${params.format}`);

        return JSON.stringify({
          _action: 'transform_content',
          format: promptData.format,
          title: params.digest_title,
          prompt: {
            systemPrompt: promptData.systemPrompt,
            userPrompt: promptData.userPrompt,
          },
        }, null, 2);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error('veille_transform_content failed', msg);
        return JSON.stringify({
          _action: 'transform_content',
          error: `Error transforming content: ${msg}`,
        }, null, 2);
      }
    },
  };
}
