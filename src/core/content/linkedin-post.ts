import type { ContentFormat, TransformInput, TransformPromptData } from '../types/index.js';
import { BaseTransformer } from './base.js';
import { buildLinkedInPrompt } from './prompts.js';

/**
 * Transformer that converts a digest into a LinkedIn post.
 *
 * Produces a concise post (max 1300 characters) with an attention-grabbing
 * hook, emoji-bulleted key insights, an engagement question, and hashtags.
 */
export class LinkedInPostTransformer extends BaseTransformer {
  readonly format: ContentFormat = 'linkedin_post';
  readonly name = 'LinkedIn Post';

  buildPrompt(input: TransformInput): TransformPromptData {
    const { digestMarkdown, digestTitle, language } = input;
    const { system, instruction } = buildLinkedInPrompt(digestTitle, language);

    return {
      systemPrompt: system,
      userPrompt: `${instruction}\n\n---\n\n${digestMarkdown}`,
      format: this.format,
    };
  }
}
