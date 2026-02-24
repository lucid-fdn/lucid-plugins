import type { ContentFormat, TransformInput, TransformPromptData } from '../types/index.js';
import { BaseTransformer } from './base.js';
import { buildNewsletterPrompt } from './prompts.js';

/**
 * Transformer that converts a digest into an email newsletter.
 *
 * Produces a structured newsletter with subject line, preview text, greeting,
 * executive summary, detailed sections, call-to-action, and sign-off, all in
 * markdown that converts cleanly to email HTML.
 */
export class NewsletterTransformer extends BaseTransformer {
  readonly format: ContentFormat = 'newsletter';
  readonly name = 'Newsletter';

  buildPrompt(input: TransformInput): TransformPromptData {
    const { digestMarkdown, digestTitle, language } = input;
    const { system, instruction } = buildNewsletterPrompt(digestTitle, language);

    return {
      systemPrompt: system,
      userPrompt: `${instruction}\n\n---\n\n${digestMarkdown}`,
      format: this.format,
    };
  }
}
