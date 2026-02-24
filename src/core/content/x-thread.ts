import type { ContentFormat, TransformInput, TransformPromptData } from '../types/index.js';
import { BaseTransformer } from './base.js';
import { buildXThreadPrompt } from './prompts.js';

/**
 * Transformer that converts a digest into a Twitter/X thread.
 *
 * Produces a numbered thread where each tweet is under 280 characters,
 * starting with a hook and ending with a call-to-action summary.
 */
export class XThreadTransformer extends BaseTransformer {
  readonly format: ContentFormat = 'x_thread';
  readonly name = 'X Thread';

  buildPrompt(input: TransformInput): TransformPromptData {
    const { digestMarkdown, digestTitle, language } = input;
    const { system, instruction } = buildXThreadPrompt(digestTitle, language);

    return {
      systemPrompt: system,
      userPrompt: `${instruction}\n\n---\n\n${digestMarkdown}`,
      format: this.format,
    };
  }
}
