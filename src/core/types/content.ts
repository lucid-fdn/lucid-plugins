import type { ContentFormat } from './common.js';

export interface TransformInput {
  digestMarkdown: string;
  digestTitle: string;
  format: ContentFormat;
  language: string;
}

export interface TransformPromptData {
  systemPrompt: string;
  userPrompt: string;
  format: ContentFormat;
}

export interface TransformResult {
  content: string;
  format: ContentFormat;
  title: string;
  metadata: Record<string, unknown>;
}

export interface ContentTransformer {
  readonly format: ContentFormat;
  readonly name: string;
  buildPrompt(input: TransformInput): TransformPromptData;
}
