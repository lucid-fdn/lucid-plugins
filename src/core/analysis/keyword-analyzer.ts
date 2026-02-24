// ---------------------------------------------------------------------------
// keyword-analyzer.ts -- Keyword classification, difficulty, grouping
// ---------------------------------------------------------------------------

import type { KeywordIntent, DifficultyLevel } from '../types/common.js';
import type { KeywordData } from '../types/provider.js';

const TRANSACTIONAL_SIGNALS = ['buy', 'price', 'cheap', 'deal', 'coupon', 'discount', 'order', 'purchase', 'shop', 'store'];
const COMMERCIAL_SIGNALS = ['best', 'top', 'review', 'compare', 'vs', 'alternative', 'comparison', 'rated'];
const NAVIGATIONAL_SIGNALS = ['login', 'sign in', 'website', 'official', 'app', 'download', 'contact'];
const INFORMATIONAL_SIGNALS = ['how', 'what', 'why', 'when', 'where', 'who', 'guide', 'tutorial', 'tips', 'learn', 'examples'];

export function classifyIntent(keyword: string): KeywordIntent {
  const kw = keyword.toLowerCase();

  if (TRANSACTIONAL_SIGNALS.some((s) => kw.includes(s))) return 'transactional';
  if (COMMERCIAL_SIGNALS.some((s) => kw.includes(s))) return 'commercial';
  if (NAVIGATIONAL_SIGNALS.some((s) => kw.includes(s))) return 'navigational';
  if (INFORMATIONAL_SIGNALS.some((s) => kw.includes(s))) return 'informational';

  // Default heuristic: short queries tend to be navigational, long ones informational
  const words = kw.split(/\s+/);
  if (words.length <= 2) return 'navigational';
  return 'informational';
}

export function calculateDifficulty(competition: number, volume: number): DifficultyLevel {
  // Weighted score: competition (0-1) + volume factor
  const volumeFactor = Math.min(volume / 100_000, 1);
  const score = competition * 0.7 + volumeFactor * 0.3;

  if (score < 0.25) return 'easy';
  if (score < 0.50) return 'medium';
  if (score < 0.75) return 'hard';
  return 'very_hard';
}

export function calculateDifficultyScore(competition: number, volume: number): number {
  const volumeFactor = Math.min(volume / 100_000, 1);
  return Math.round((competition * 0.7 + volumeFactor * 0.3) * 100);
}

export function groupKeywordsByTopic(keywords: KeywordData[]): Map<string, KeywordData[]> {
  const groups = new Map<string, KeywordData[]>();

  for (const kw of keywords) {
    const words = kw.keyword.toLowerCase().split(/\s+/);
    // Use the longest word as the topic root
    const topic = words.reduce((a, b) => (a.length >= b.length ? a : b), '');

    if (!groups.has(topic)) {
      groups.set(topic, []);
    }
    groups.get(topic)!.push(kw);
  }

  return groups;
}

export function suggestRelatedKeywords(keyword: string): string[] {
  const kw = keyword.toLowerCase();
  const suggestions: string[] = [];

  // Add question variants
  suggestions.push(`what is ${kw}`);
  suggestions.push(`how to ${kw}`);
  suggestions.push(`best ${kw}`);
  suggestions.push(`${kw} guide`);
  suggestions.push(`${kw} tips`);
  suggestions.push(`${kw} examples`);
  suggestions.push(`${kw} vs`);
  suggestions.push(`${kw} tutorial`);

  return suggestions;
}

export function calculateKeywordValue(volume: number, cpc: number): number {
  return Math.round(volume * cpc * 100) / 100;
}

export function sortByValue(keywords: KeywordData[]): KeywordData[] {
  return [...keywords].sort((a, b) => {
    const valueA = calculateKeywordValue(a.search_volume, a.cpc);
    const valueB = calculateKeywordValue(b.search_volume, b.cpc);
    return valueB - valueA;
  });
}
