// ---------------------------------------------------------------------------
// content-optimizer.ts -- Score content for platforms and suggest improvements
// ---------------------------------------------------------------------------

import type {
  Platform,
  ContentType,
  ContentOptimization,
  ContentSuggestion,
  PostingTime,
} from '../types/index.js';
import {
  wordCount,
  extractHashtags,
  extractMentions,
  extractUrls,
  suggestHashtags,
  optimalLength,
} from '../utils/text.js';

export interface ContentInput {
  text: string;
  platform: Platform;
  contentType?: ContentType;
  existingHashtags?: string[];
  targetAudience?: string;
}

/**
 * Score content length vs optimal length for a platform.
 * Returns 0-100.
 */
export function scoreLengthFit(text: string, platform: Platform): number {
  const len = text.length;
  const optimal = optimalLength(platform);

  if (len < optimal.min) {
    return Math.max(0, (len / optimal.min) * 60);
  }
  if (len > optimal.max) {
    return Math.max(0, 60 - ((len - optimal.max) / optimal.max) * 60);
  }
  // Within range -- score based on distance from ideal
  const distFromIdeal = Math.abs(len - optimal.ideal);
  const maxDist = Math.max(optimal.ideal - optimal.min, optimal.max - optimal.ideal);
  return Math.round(100 - (distFromIdeal / maxDist) * 40);
}

/**
 * Score hashtag usage.
 */
export function scoreHashtags(text: string, platform: Platform): number {
  const tags = extractHashtags(text);
  const optimalCounts: Record<string, { min: number; max: number; ideal: number }> = {
    twitter: { min: 1, max: 3, ideal: 2 },
    linkedin: { min: 2, max: 5, ideal: 3 },
    instagram: { min: 5, max: 30, ideal: 15 },
    tiktok: { min: 3, max: 8, ideal: 5 },
    reddit: { min: 0, max: 0, ideal: 0 },
    youtube: { min: 3, max: 15, ideal: 8 },
    discord: { min: 0, max: 1, ideal: 0 },
    telegram: { min: 0, max: 3, ideal: 1 },
    hackernews: { min: 0, max: 0, ideal: 0 },
    producthunt: { min: 1, max: 3, ideal: 2 },
  };

  const optimal = optimalCounts[platform] ?? { min: 0, max: 5, ideal: 2 };
  if (optimal.ideal === 0 && tags.length === 0) return 100;
  if (optimal.ideal === 0 && tags.length > 0) return Math.max(0, 80 - tags.length * 20);

  if (tags.length < optimal.min) {
    return Math.max(0, (tags.length / Math.max(1, optimal.min)) * 60);
  }
  if (tags.length > optimal.max) {
    return Math.max(0, 60 - ((tags.length - optimal.max) / optimal.max) * 60);
  }

  const distFromIdeal = Math.abs(tags.length - optimal.ideal);
  const maxDist = Math.max(optimal.ideal - optimal.min, optimal.max - optimal.ideal);
  return Math.round(100 - (distFromIdeal / Math.max(1, maxDist)) * 30);
}

/**
 * Score content readability (simple heuristic).
 */
export function scoreReadability(text: string): number {
  const words = wordCount(text);
  if (words === 0) return 0;

  let score = 70; // base

  // Sentences (approximate by periods, !, ?)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence = words / Math.max(1, sentences.length);

  // Ideal: 10-20 words per sentence
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
    score += 15;
  } else if (avgWordsPerSentence > 30) {
    score -= 15;
  }

  // Paragraph breaks improve readability
  const paragraphs = text.split(/\n\s*\n/).length;
  if (paragraphs > 1) score += 10;

  // Has emoji (improves social engagement)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(text)) score += 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Score CTA (call to action) presence.
 */
export function scoreCTA(text: string): number {
  const lower = text.toLowerCase();
  const ctaPatterns = [
    'check out',
    'try it',
    'sign up',
    'learn more',
    'click',
    'follow',
    'subscribe',
    'share',
    'comment',
    'let me know',
    'what do you think',
    'join',
    'download',
    'get started',
    'link in',
    'dm me',
  ];

  let found = 0;
  for (const pattern of ctaPatterns) {
    if (lower.includes(pattern)) found++;
  }

  if (found === 0) return 20;
  if (found === 1) return 80;
  if (found === 2) return 100;
  return Math.max(50, 100 - (found - 2) * 15); // Too many CTAs is spammy
}

/**
 * Generate content suggestions.
 */
export function generateSuggestions(input: ContentInput): ContentSuggestion[] {
  const suggestions: ContentSuggestion[] = [];
  const { text, platform } = input;
  const optimal = optimalLength(platform);

  // Length suggestion
  if (text.length < optimal.min) {
    suggestions.push({
      area: 'Content Length',
      current: `${text.length} characters`,
      recommended: `At least ${optimal.min} characters for ${platform}`,
      impact: 60,
    });
  } else if (text.length > optimal.max) {
    suggestions.push({
      area: 'Content Length',
      current: `${text.length} characters`,
      recommended: `Under ${optimal.max} characters for ${platform}`,
      impact: 50,
    });
  }

  // Hashtag suggestions
  const currentTags = extractHashtags(text);
  const recommended = suggestHashtags(text, platform);
  if (currentTags.length === 0 && platform !== 'reddit' && platform !== 'hackernews') {
    suggestions.push({
      area: 'Hashtags',
      current: 'No hashtags',
      recommended: `Add hashtags: ${recommended.slice(0, 3).join(', ')}`,
      impact: 40,
    });
  }

  // CTA suggestion
  const ctaScore = scoreCTA(text);
  if (ctaScore < 50) {
    suggestions.push({
      area: 'Call to Action',
      current: 'No clear CTA',
      recommended: 'Add a clear call to action (e.g., "Check it out", "What do you think?")',
      impact: 55,
    });
  }

  // Mentions
  const mentions = extractMentions(text);
  if (mentions.length === 0 && (platform === 'twitter' || platform === 'linkedin')) {
    suggestions.push({
      area: 'Mentions',
      current: 'No mentions',
      recommended: 'Tag relevant people or brands to increase visibility',
      impact: 35,
    });
  }

  // URLs
  const urls = extractUrls(text);
  if (urls.length === 0 && (platform === 'linkedin' || platform === 'reddit')) {
    suggestions.push({
      area: 'Links',
      current: 'No links',
      recommended: 'Include a relevant link for context',
      impact: 30,
    });
  }

  return suggestions.sort((a, b) => b.impact - a.impact);
}

/**
 * Determine best content format for a platform.
 */
export function recommendContentType(platform: Platform): ContentType {
  const map: Record<Platform, ContentType> = {
    twitter: 'post',
    linkedin: 'article',
    reddit: 'post',
    tiktok: 'video',
    youtube: 'video',
    instagram: 'reel',
    discord: 'post',
    telegram: 'post',
    hackernews: 'article',
    producthunt: 'post',
  };
  return map[platform];
}

/**
 * Full content optimization analysis.
 */
export function optimizeContent(input: ContentInput): ContentOptimization {
  const { text, platform } = input;

  const lengthScore = scoreLengthFit(text, platform);
  const hashtagScore = scoreHashtags(text, platform);
  const readabilityScore = scoreReadability(text);
  const ctaScore = scoreCTA(text);

  const overallScore = Math.round(
    lengthScore * 0.3 + hashtagScore * 0.2 + readabilityScore * 0.3 + ctaScore * 0.2,
  );

  const suggestions = generateSuggestions(input);
  const recommended = suggestHashtags(text, platform);
  const optimal = optimalLength(platform);

  return {
    platform,
    overallScore: Math.max(0, Math.min(100, overallScore)),
    suggestions,
    optimalLength: optimal.ideal,
    recommendedHashtags: recommended,
    recommendedFormat: input.contentType ?? recommendContentType(platform),
    bestPostingTime: null, // Requires historical data, set externally
  };
}
