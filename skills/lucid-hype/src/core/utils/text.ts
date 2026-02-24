// ---------------------------------------------------------------------------
// text.ts -- Text utilities for content analysis and formatting
// ---------------------------------------------------------------------------

/** Truncate a string to a max length, appending '...' if truncated */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/** Format a number with K/M/B suffixes */
export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/** Format as percentage */
export function formatPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

/** Count words in text */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/** Extract hashtags from text */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w]+/g);
  return matches ? [...new Set(matches.map((h) => h.toLowerCase()))] : [];
}

/** Extract mentions from text (e.g. @user) */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w]+/g);
  return matches ? [...new Set(matches.map((m) => m.toLowerCase()))] : [];
}

/** Calculate reading time in minutes */
export function readingTime(text: string): number {
  const words = wordCount(text);
  return Math.max(1, Math.ceil(words / 200));
}

/** Extract URLs from text */
export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>)"']+/g;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

/** Calculate text sentiment score based on simple keyword analysis (-1 to 1) */
export function simpleSentiment(text: string): number {
  const lower = text.toLowerCase();
  const positiveWords = [
    'amazing',
    'awesome',
    'great',
    'excellent',
    'love',
    'best',
    'fantastic',
    'incredible',
    'wonderful',
    'brilliant',
    'outstanding',
    'perfect',
    'impressive',
    'revolutionary',
    'innovative',
  ];
  const negativeWords = [
    'terrible',
    'awful',
    'worst',
    'hate',
    'bad',
    'horrible',
    'disappointing',
    'poor',
    'useless',
    'broken',
    'scam',
    'fraud',
    'trash',
    'garbage',
    'boring',
  ];

  let score = 0;
  for (const word of positiveWords) {
    if (lower.includes(word)) score += 1;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) score -= 1;
  }

  const maxMagnitude = Math.max(positiveWords.length, negativeWords.length);
  return Math.max(-1, Math.min(1, score / Math.max(1, maxMagnitude / 3)));
}

/** Suggest hashtags based on content text */
export function suggestHashtags(text: string, platform: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];

  const topicMap: Record<string, string[]> = {
    ai: ['#AI', '#MachineLearning', '#ArtificialIntelligence'],
    startup: ['#Startup', '#Entrepreneurship', '#StartupLife'],
    marketing: ['#Marketing', '#DigitalMarketing', '#GrowthHacking'],
    crypto: ['#Crypto', '#Web3', '#Blockchain'],
    saas: ['#SaaS', '#B2B', '#Software'],
    design: ['#Design', '#UX', '#UI'],
    coding: ['#Coding', '#Programming', '#Dev'],
    product: ['#ProductHunt', '#Product', '#Launch'],
  };

  for (const [keyword, hashtags] of Object.entries(topicMap)) {
    if (lower.includes(keyword)) {
      tags.push(...hashtags);
    }
  }

  // Platform-specific tags
  if (platform === 'twitter') {
    tags.push('#BuildInPublic');
  } else if (platform === 'linkedin') {
    tags.push('#Innovation');
  } else if (platform === 'instagram') {
    tags.push('#InstaGrowth');
  }

  return [...new Set(tags)].slice(0, 10);
}

/** Get optimal content length for a platform */
export function optimalLength(platform: string): { min: number; max: number; ideal: number } {
  const lengths: Record<string, { min: number; max: number; ideal: number }> = {
    twitter: { min: 50, max: 280, ideal: 200 },
    linkedin: { min: 100, max: 3000, ideal: 1300 },
    reddit: { min: 50, max: 10000, ideal: 500 },
    tiktok: { min: 10, max: 150, ideal: 80 },
    youtube: { min: 100, max: 5000, ideal: 2000 },
    instagram: { min: 50, max: 2200, ideal: 500 },
    discord: { min: 10, max: 2000, ideal: 300 },
    telegram: { min: 10, max: 4096, ideal: 500 },
    hackernews: { min: 50, max: 10000, ideal: 300 },
    producthunt: { min: 50, max: 500, ideal: 200 },
  };
  return lengths[platform] ?? { min: 50, max: 2000, ideal: 500 };
}
