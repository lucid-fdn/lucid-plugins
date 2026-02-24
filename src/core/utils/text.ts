// ---------------------------------------------------------------------------
// text.ts -- Text utilities
// ---------------------------------------------------------------------------

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

export function formatUsd(n: number): string {
  return `$${formatNumber(n)}`;
}

export function formatPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

export function countWords(text: string): number {
  return text
    .replace(/<[^>]*>/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function calculateReadability(text: string): number {
  const plain = stripHtml(text);
  const sentences = plain.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = plain.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const vowelGroups = w.match(/[aeiouy]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  if (w.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

export function calculateKeywordDensity(text: string, keyword: string): number {
  const plain = stripHtml(text).toLowerCase();
  const kw = keyword.toLowerCase();
  const words = plain.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return 0;

  const kwWords = kw.split(/\s+/);
  let occurrences = 0;

  for (let i = 0; i <= words.length - kwWords.length; i++) {
    const slice = words.slice(i, i + kwWords.length).join(' ');
    if (slice === kw) occurrences++;
  }

  return (occurrences * kwWords.length * 100) / words.length;
}
