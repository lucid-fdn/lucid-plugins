import type { DigestType, RankedItem } from '../types/index.js';
import { truncate } from '../utils/text.js';

export interface DigestSystemPromptOptions {
  language: string;
  timezone: string;
  date: string;
  digestType: DigestType;
}

/**
 * Build the system prompt for digest generation.
 *
 * The returned prompt instructs the LLM to act as a content curator and
 * produce a structured markdown digest.
 */
export function buildDigestSystemPrompt(opts: DigestSystemPromptOptions): string {
  const { language, timezone, date, digestType } = opts;

  const timeframe =
    digestType === 'weekly'
      ? 'This digest covers the past 7 days.'
      : 'This digest covers the past 24 hours.';

  return [
    `You are an expert content curator and tech analyst.`,
    `Generate a ${digestType} digest in ${language}.`,
    `Today's date is ${date} (${timezone}).`,
    timeframe,
    `Structure the digest with:`,
    `1) A compelling title`,
    `2) Executive summary (2-3 sentences)`,
    `3) Key topics grouped by theme`,
    `4) For each item: title, source, brief analysis, relevance`,
    `Use markdown formatting. Be concise but insightful.`,
  ].join(' ');
}

/**
 * Build the user prompt containing the ranked items for the LLM to process.
 *
 * Each item is formatted with its composite score, trust/recency/relevance
 * breakdowns, title, URL, source, and summary so the LLM has all the context
 * it needs to generate a high-quality digest.
 */
export function buildDigestUserPrompt(rankedItems: RankedItem[]): string {
  if (rankedItems.length === 0) {
    return 'No items available for this digest period.';
  }

  const header = `Here are ${rankedItems.length} ranked items to include in the digest:\n`;

  const lines = rankedItems.map((ri, idx) => {
    const { item, score, trustScore, recencyScore, relevanceScore } = ri;

    const parts: string[] = [
      `### Item ${idx + 1} — Score: ${score.toFixed(3)}`,
      `  Relevance: ${relevanceScore.toFixed(2)} | Trust: ${trustScore.toFixed(2)} | Recency: ${recencyScore.toFixed(2)}`,
    ];

    if (item.title) {
      parts.push(`  Title: ${item.title}`);
    }

    parts.push(`  URL: ${item.canonical_url}`);

    if (item.source) {
      parts.push(`  Source: ${item.source}`);
    }

    if (item.author) {
      parts.push(`  Author: ${item.author}`);
    }

    if (item.published_at) {
      parts.push(`  Published: ${item.published_at}`);
    }

    if (item.tags && item.tags.length > 0) {
      parts.push(`  Tags: ${item.tags.join(', ')}`);
    }

    if (item.summary) {
      parts.push(`  Summary: ${truncate(item.summary, 500)}`);
    }

    return parts.join('\n');
  });

  return header + lines.join('\n\n');
}
