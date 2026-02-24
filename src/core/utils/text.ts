/**
 * Truncate a string to a maximum length, adding ellipsis if needed.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Normalize whitespace in text.
 */
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Slugify a string for use in URLs or identifiers.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extract email addresses from text.
 */
export function extractEmails(text: string): string[] {
  const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(pattern) ?? [])];
}

/**
 * Extract phone numbers from text (basic pattern).
 */
export function extractPhones(text: string): string[] {
  const pattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  return [...new Set(text.match(pattern) ?? [])];
}

/**
 * Calculate a simple similarity score between two strings (Jaccard index on words).
 */
export function wordSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const word of setA) {
    if (setB.has(word)) intersection++;
  }
  return intersection / (setA.size + setB.size - intersection);
}

/**
 * Normalize a skill string for comparison.
 */
export function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/[.\-_/]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * Check if two skill strings match (case-insensitive, punctuation-insensitive).
 */
export function skillsMatch(a: string, b: string): boolean {
  return normalizeSkill(a) === normalizeSkill(b);
}
