import type { ContentTransformer, ContentFormat, TransformInput, TransformPromptData } from '../types/index.js';

/**
 * Abstract base class for content transformers.
 *
 * Each concrete transformer implements the `buildPrompt` method which
 * constructs format-specific system and user prompts. The actual LLM
 * invocation is handled by the OpenClaw agent, not by the transformer.
 */
export abstract class BaseTransformer implements ContentTransformer {
  abstract readonly format: ContentFormat;
  abstract readonly name: string;

  /**
   * Build the system and user prompts for this content format.
   *
   * @param input - The digest content and metadata to transform.
   * @returns TransformPromptData containing the prompts and format identifier.
   */
  abstract buildPrompt(input: TransformInput): TransformPromptData;
}
