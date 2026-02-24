import type { ContentFormat, TransformInput, TransformPromptData } from '../types/index.js';
import { BaseTransformer } from './base.js';
import { buildBlogPostPrompt } from './prompts.js';

/**
 * Transformer that converts a digest into a polished blog post.
 *
 * Produces a full markdown blog post with title, introduction, structured
 * body sections with analysis, and concluding takeaways.
 */
export class BlogPostTransformer extends BaseTransformer {
  readonly format: ContentFormat = 'blog_post';
  readonly name = 'Blog Post';

  buildPrompt(input: TransformInput): TransformPromptData {
    const { digestMarkdown, digestTitle, language } = input;
    const { system, instruction } = buildBlogPostPrompt(digestTitle, language);

    return {
      systemPrompt: system,
      userPrompt: `${instruction}\n\n---\n\n${digestMarkdown}`,
      format: this.format,
    };
  }
}
