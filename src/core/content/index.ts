import type { ContentTransformer, ContentFormat } from '../types/index.js';
import { BlogPostTransformer } from './blog-post.js';
import { XThreadTransformer } from './x-thread.js';
import { LinkedInPostTransformer } from './linkedin-post.js';
import { NewsletterTransformer } from './newsletter.js';

/**
 * Create a registry of all available content transformers, keyed by format.
 *
 * Usage:
 * ```ts
 * const registry = createTransformerRegistry();
 * const transformer = registry.get('blog_post');
 * const promptData = transformer?.buildPrompt(input);
 * ```
 */
export function createTransformerRegistry(): Map<ContentFormat, ContentTransformer> {
  const registry = new Map<ContentFormat, ContentTransformer>();

  const transformers: ContentTransformer[] = [
    new BlogPostTransformer(),
    new XThreadTransformer(),
    new LinkedInPostTransformer(),
    new NewsletterTransformer(),
  ];

  for (const transformer of transformers) {
    registry.set(transformer.format, transformer);
  }

  return registry;
}

export { BaseTransformer } from './base.js';
export { BlogPostTransformer } from './blog-post.js';
export { XThreadTransformer } from './x-thread.js';
export { LinkedInPostTransformer } from './linkedin-post.js';
export { NewsletterTransformer } from './newsletter.js';
export {
  buildBlogPostPrompt,
  buildXThreadPrompt,
  buildLinkedInPrompt,
  buildNewsletterPrompt,
  type FormatPrompt,
} from './prompts.js';
