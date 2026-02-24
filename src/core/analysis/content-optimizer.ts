// ---------------------------------------------------------------------------
// content-optimizer.ts -- Content analysis and optimization scoring
// ---------------------------------------------------------------------------

import { stripHtml, countWords, calculateReadability, calculateKeywordDensity } from '../utils/text.js';

export interface ContentScore {
  overall: number;
  readability: number;
  keyword_density: number;
  word_count: number;
  has_meta_title: boolean;
  has_meta_description: boolean;
  heading_score: number;
  suggestions: string[];
}

export interface HeadingInfo {
  tag: string;
  text: string;
}

export function analyzeContent(html: string, targetKeyword: string): ContentScore {
  const plain = stripHtml(html);
  const wordCount = countWords(plain);
  const readability = checkReadability(plain);
  const density = checkKeywordDensity(plain, targetKeyword);
  const headings = extractHeadings(html);
  const headingScore = analyzeHeadings(headings, targetKeyword);
  const hasMetaTitle = /<title[^>]*>/.test(html);
  const hasMetaDescription = /<meta[^>]*name=["']description["'][^>]*>/.test(html);

  const suggestions = suggestImprovements({
    wordCount,
    readability,
    density,
    headingScore,
    hasMetaTitle,
    hasMetaDescription,
    targetKeyword,
  });

  const overall = calculateOverallScore({
    readability,
    density,
    wordCount,
    headingScore,
    hasMetaTitle,
    hasMetaDescription,
  });

  return {
    overall,
    readability,
    keyword_density: density,
    word_count: wordCount,
    has_meta_title: hasMetaTitle,
    has_meta_description: hasMetaDescription,
    heading_score: headingScore,
    suggestions,
  };
}

export function checkReadability(text: string): number {
  return calculateReadability(text);
}

export function checkKeywordDensity(text: string, keyword: string): number {
  return calculateKeywordDensity(text, keyword);
}

export function extractHeadings(html: string): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const regex = /<(h[1-6])[^>]*>(.*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    headings.push({
      tag: match[1].toLowerCase(),
      text: stripHtml(match[2]),
    });
  }

  return headings;
}

export function analyzeHeadings(headings: HeadingInfo[], targetKeyword: string): number {
  if (headings.length === 0) return 0;

  let score = 0;
  const kw = targetKeyword.toLowerCase();

  // Has H1
  const h1s = headings.filter((h) => h.tag === 'h1');
  if (h1s.length === 1) score += 30;
  else if (h1s.length > 1) score += 10; // Multiple H1s is not ideal

  // H1 contains keyword
  if (h1s.some((h) => h.text.toLowerCase().includes(kw))) score += 20;

  // Has H2s
  const h2s = headings.filter((h) => h.tag === 'h2');
  if (h2s.length >= 2) score += 20;
  else if (h2s.length === 1) score += 10;

  // Some H2s contain keyword
  if (h2s.some((h) => h.text.toLowerCase().includes(kw))) score += 15;

  // Proper hierarchy (no skipping levels)
  const levels = headings.map((h) => parseInt(h.tag[1], 10));
  let properHierarchy = true;
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) {
      properHierarchy = false;
      break;
    }
  }
  if (properHierarchy) score += 15;

  return Math.min(100, score);
}

export function suggestImprovements(params: {
  wordCount: number;
  readability: number;
  density: number;
  headingScore: number;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
  targetKeyword: string;
}): string[] {
  const suggestions: string[] = [];

  if (params.wordCount < 300) {
    suggestions.push('Content is too short. Aim for at least 1,000 words for better rankings.');
  } else if (params.wordCount < 1000) {
    suggestions.push('Content could be longer. Pages with 1,500+ words tend to rank higher.');
  }

  if (params.readability < 30) {
    suggestions.push('Readability is low. Use shorter sentences and simpler words.');
  } else if (params.readability < 50) {
    suggestions.push('Readability could be improved. Consider breaking up complex sentences.');
  }

  if (params.density < 0.5) {
    suggestions.push(
      `Keyword density is too low (${params.density.toFixed(1)}%). Mention "${params.targetKeyword}" more naturally.`,
    );
  } else if (params.density > 3.0) {
    suggestions.push(
      `Keyword density is too high (${params.density.toFixed(1)}%). Reduce keyword stuffing.`,
    );
  }

  if (params.headingScore < 50) {
    suggestions.push(
      'Improve heading structure. Use one H1 and multiple H2s containing your target keyword.',
    );
  }

  if (!params.hasMetaTitle) {
    suggestions.push('Add a meta title tag containing your target keyword.');
  }

  if (!params.hasMetaDescription) {
    suggestions.push('Add a meta description tag to improve click-through rates.');
  }

  return suggestions;
}

function calculateOverallScore(params: {
  readability: number;
  density: number;
  wordCount: number;
  headingScore: number;
  hasMetaTitle: boolean;
  hasMetaDescription: boolean;
}): number {
  let score = 0;

  // Readability (25 points)
  score += (params.readability / 100) * 25;

  // Keyword density (20 points) - optimal is 1-2%
  if (params.density >= 0.5 && params.density <= 3.0) {
    score += 20;
  } else if (params.density > 0 && params.density < 0.5) {
    score += 10;
  } else if (params.density > 3.0) {
    score += 5;
  }

  // Word count (20 points)
  if (params.wordCount >= 1500) score += 20;
  else if (params.wordCount >= 1000) score += 15;
  else if (params.wordCount >= 500) score += 10;
  else if (params.wordCount >= 300) score += 5;

  // Heading structure (20 points)
  score += (params.headingScore / 100) * 20;

  // Meta tags (15 points)
  if (params.hasMetaTitle) score += 8;
  if (params.hasMetaDescription) score += 7;

  return Math.round(Math.min(100, score));
}
