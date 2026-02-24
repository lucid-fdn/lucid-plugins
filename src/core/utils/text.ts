/**
 * Truncate text to a maximum length, appending an ellipsis if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Slugify a string for use in URLs or identifiers.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Strip HTML tags from text.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Calculate reading time in minutes for given text.
 */
export function readingTimeMinutes(text: string, wordsPerMinute: number = 200): number {
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Count words in text.
 */
export function wordCount(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

/**
 * Calculate a basic readability score (0-100).
 * Higher = easier to read.
 * Uses average sentence length and average word length as heuristics.
 */
export function readabilityScore(text: string): number {
  if (!text.trim()) return 0;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (words.length === 0 || sentences.length === 0) return 0;

  const avgSentenceLength = words.length / sentences.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;

  // Penalize very long sentences and very long words
  const sentencePenalty = Math.max(0, (avgSentenceLength - 15) * 2);
  const wordPenalty = Math.max(0, (avgWordLength - 5) * 5);

  const score = Math.max(0, Math.min(100, 100 - sentencePenalty - wordPenalty));
  return Math.round(score);
}

/**
 * Extract the first N sentences from text.
 */
export function extractSentences(text: string, count: number): string {
  const sentences = text.match(/[^.!?]*[.!?]+/g) || [];
  return sentences.slice(0, count).join(' ').trim();
}

/**
 * Capitalize the first letter of each word.
 */
export function titleCase(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}
