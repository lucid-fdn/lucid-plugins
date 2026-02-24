// ---------------------------------------------------------------------------
// sentiment-analyzer.ts -- Sentiment analysis, NPS classification, theme extraction, urgency detection
// ---------------------------------------------------------------------------

import type { Sentiment, NpsType, PriorityLevel } from '../types/common.js';

// ---------------------------------------------------------------------------
// Keyword dictionaries for lexicon-based sentiment analysis
// ---------------------------------------------------------------------------

const POSITIVE_WORDS = new Set([
  'love', 'great', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful',
  'perfect', 'best', 'happy', 'pleased', 'impressed', 'recommend', 'outstanding',
  'brilliant', 'superb', 'delightful', 'enjoy', 'intuitive', 'easy', 'fast',
  'reliable', 'helpful', 'friendly', 'smooth', 'clean', 'beautiful', 'powerful',
  'efficient', 'seamless', 'solid', 'nice', 'good', 'thanks', 'thank',
]);

const NEGATIVE_WORDS = new Set([
  'hate', 'terrible', 'awful', 'horrible', 'worst', 'bad', 'poor', 'broken',
  'bug', 'crash', 'slow', 'frustrating', 'annoying', 'confusing', 'difficult',
  'expensive', 'overpriced', 'unusable', 'disappointed', 'failure', 'fail',
  'error', 'issue', 'problem', 'complaint', 'unresponsive', 'laggy', 'ugly',
  'complicated', 'missing', 'lacking', 'unreliable', 'useless', 'waste',
]);

const VERY_POSITIVE_WORDS = new Set([
  'love', 'excellent', 'amazing', 'awesome', 'fantastic', 'wonderful', 'perfect',
  'best', 'outstanding', 'brilliant', 'superb', 'delightful',
]);

const VERY_NEGATIVE_WORDS = new Set([
  'hate', 'terrible', 'awful', 'horrible', 'worst', 'unusable', 'failure',
  'crash', 'broken', 'useless', 'waste',
]);

const URGENCY_WORDS = new Set([
  'urgent', 'asap', 'immediately', 'critical', 'emergency', 'blocker',
  'blocking', 'production', 'down', 'outage', 'cannot', "can't", 'unable',
  'deadline', 'showstopper', 'data loss', 'security',
]);

export interface SentimentResult {
  sentiment: Sentiment;
  confidence: number;
  keywords: string[];
}

export interface Theme {
  name: string;
  count: number;
  sentiment_avg: number;
  keywords: string[];
}

/**
 * Analyze the sentiment of a text using lexicon-based scoring.
 */
export function analyzeSentiment(text: string): SentimentResult {
  const lower = text.toLowerCase();
  const words = lower.replace(/[^a-z0-9\s']/g, '').split(/\s+/).filter((w) => w.length > 1);

  let positiveCount = 0;
  let negativeCount = 0;
  let veryPositiveCount = 0;
  let veryNegativeCount = 0;
  const keywords: string[] = [];

  for (const word of words) {
    if (VERY_POSITIVE_WORDS.has(word)) {
      veryPositiveCount++;
      positiveCount++;
      keywords.push(word);
    } else if (VERY_NEGATIVE_WORDS.has(word)) {
      veryNegativeCount++;
      negativeCount++;
      keywords.push(word);
    } else if (POSITIVE_WORDS.has(word)) {
      positiveCount++;
      keywords.push(word);
    } else if (NEGATIVE_WORDS.has(word)) {
      negativeCount++;
      keywords.push(word);
    }
  }

  const totalSignals = positiveCount + negativeCount;
  const score = totalSignals === 0 ? 0 : (positiveCount - negativeCount) / totalSignals;

  let sentiment: Sentiment;
  if (score > 0.5 || veryPositiveCount > 0) {
    sentiment = veryPositiveCount >= 2 || score > 0.8 ? 'very_positive' : 'positive';
  } else if (score < -0.5 || veryNegativeCount > 0) {
    sentiment = veryNegativeCount >= 2 || score < -0.8 ? 'very_negative' : 'negative';
  } else if (score > 0.1) {
    sentiment = 'positive';
  } else if (score < -0.1) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  // Confidence is higher when there are more signal words and they agree
  const confidence = totalSignals === 0
    ? 0.3
    : Math.min(0.95, 0.5 + (totalSignals * 0.05) + (Math.abs(score) * 0.3));

  return { sentiment, confidence, keywords: [...new Set(keywords)] };
}

/**
 * Classify an NPS score into detractor, passive, or promoter.
 */
export function classifyNps(score: number): NpsType {
  if (score <= 6) return 'detractor';
  if (score <= 8) return 'passive';
  return 'promoter';
}

/**
 * Extract common themes from a collection of feedback items.
 */
export function extractThemes(items: Array<{ content: string; sentiment?: Sentiment | null }>): Theme[] {
  const themeMap = new Map<string, { count: number; sentimentScores: number[]; keywords: Set<string> }>();

  // Common theme keyword groups
  const themeKeywords: Record<string, string[]> = {
    performance: ['slow', 'fast', 'speed', 'performance', 'loading', 'lag', 'latency', 'quick', 'responsive'],
    usability: ['easy', 'difficult', 'confusing', 'intuitive', 'ux', 'ui', 'interface', 'design', 'navigation', 'user-friendly'],
    reliability: ['crash', 'bug', 'error', 'broken', 'reliable', 'stable', 'downtime', 'outage', 'fix'],
    pricing: ['price', 'expensive', 'cheap', 'cost', 'pricing', 'value', 'worth', 'overpriced', 'affordable', 'subscription'],
    support: ['support', 'help', 'response', 'team', 'service', 'customer', 'ticket', 'wait', 'resolve'],
    features: ['feature', 'missing', 'need', 'want', 'wish', 'add', 'integration', 'api', 'functionality'],
    documentation: ['docs', 'documentation', 'guide', 'tutorial', 'example', 'instructions', 'readme'],
    onboarding: ['onboarding', 'setup', 'install', 'getting started', 'start', 'learn', 'beginner'],
  };

  const sentimentToScore: Record<string, number> = {
    very_negative: -1,
    negative: -0.5,
    neutral: 0,
    positive: 0.5,
    very_positive: 1,
  };

  for (const item of items) {
    const lower = item.content.toLowerCase();
    const sentScore = item.sentiment ? sentimentToScore[item.sentiment] ?? 0 : 0;

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      const matchedKeywords = keywords.filter((kw) => lower.includes(kw));
      if (matchedKeywords.length > 0) {
        const existing = themeMap.get(theme);
        if (existing) {
          existing.count++;
          existing.sentimentScores.push(sentScore);
          matchedKeywords.forEach((kw) => existing.keywords.add(kw));
        } else {
          themeMap.set(theme, {
            count: 1,
            sentimentScores: [sentScore],
            keywords: new Set(matchedKeywords),
          });
        }
      }
    }
  }

  return Array.from(themeMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      sentiment_avg: data.sentimentScores.reduce((a, b) => a + b, 0) / data.sentimentScores.length,
      keywords: [...data.keywords],
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detect urgency level from text content.
 */
export function detectUrgency(text: string): PriorityLevel {
  const lower = text.toLowerCase();
  let urgencyScore = 0;

  for (const word of URGENCY_WORDS) {
    if (lower.includes(word)) {
      urgencyScore++;
    }
  }

  // Check for emphasis markers
  if (lower.includes('!!!') || lower.includes('URGENT') || text.includes('ASAP')) {
    urgencyScore += 2;
  }

  if (urgencyScore >= 4) return 'critical';
  if (urgencyScore >= 2) return 'high';
  if (urgencyScore >= 1) return 'medium';
  return 'low';
}
