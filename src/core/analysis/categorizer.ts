// ---------------------------------------------------------------------------
// categorizer.ts -- Feedback categorization, feature request extraction, prioritization
// ---------------------------------------------------------------------------

import type { Category, PriorityLevel, Sentiment } from '../types/common.js';
import { analyzeSentiment, detectUrgency } from './sentiment-analyzer.js';

// ---------------------------------------------------------------------------
// Category keyword mapping
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  bug: ['bug', 'error', 'crash', 'broken', 'fix', 'issue', 'glitch', 'defect', 'not working', 'fails', 'exception', 'fault'],
  feature_request: ['feature', 'wish', 'would be nice', 'please add', 'suggestion', 'could you', 'ability to', 'need', 'want', 'request', 'proposal', 'idea'],
  ux: ['confusing', 'ui', 'ux', 'interface', 'design', 'layout', 'navigation', 'workflow', 'usability', 'user experience', 'hard to find', 'unintuitive'],
  performance: ['slow', 'fast', 'performance', 'speed', 'loading', 'lag', 'latency', 'timeout', 'memory', 'cpu', 'optimize', 'bandwidth'],
  pricing: ['price', 'pricing', 'expensive', 'cheap', 'cost', 'plan', 'subscription', 'billing', 'invoice', 'refund', 'discount', 'free tier'],
  support: ['support', 'help', 'response time', 'customer service', 'ticket', 'wait', 'agent', 'representative', 'chat', 'phone'],
  documentation: ['docs', 'documentation', 'guide', 'tutorial', 'example', 'readme', 'api docs', 'manual', 'instructions', 'reference'],
  general: [],
};

export interface FeatureRequest {
  content: string;
  category: 'feature_request';
  priority: PriorityLevel;
  keywords: string[];
  sentiment: Sentiment;
}

export interface PrioritizedItem {
  content: string;
  category: Category;
  priority: PriorityLevel;
  sentiment: Sentiment;
  urgency_score: number;
  impact_score: number;
}

/**
 * Categorize text into a feedback category using keyword matching.
 */
export function categorize(text: string): Category {
  const lower = text.toLowerCase();
  let bestCategory: Category = 'general';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'general') continue;
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat as Category;
    }
  }

  return bestCategory;
}

/**
 * Extract feature requests from a list of feedback items.
 */
export function extractFeatureRequests(
  items: Array<{ content: string; category?: Category | null; sentiment?: Sentiment | null }>,
): FeatureRequest[] {
  const requests: FeatureRequest[] = [];

  for (const item of items) {
    const cat = item.category ?? categorize(item.content);
    if (cat !== 'feature_request') continue;

    const lower = item.content.toLowerCase();
    const keywords = CATEGORY_KEYWORDS.feature_request.filter((kw) => lower.includes(kw));
    const sentimentResult = item.sentiment ?? analyzeSentiment(item.content).sentiment;
    const urgency = detectUrgency(item.content);

    requests.push({
      content: item.content,
      category: 'feature_request',
      priority: urgency,
      keywords,
      sentiment: sentimentResult,
    });
  }

  return requests.sort((a, b) => {
    const order: PriorityLevel[] = ['critical', 'high', 'medium', 'low'];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });
}

/**
 * Prioritize feedback items based on sentiment, urgency, and category.
 */
export function prioritizeFeedback(
  items: Array<{ content: string; category?: Category | null; sentiment?: Sentiment | null }>,
): PrioritizedItem[] {
  const sentimentImpact: Record<Sentiment, number> = {
    very_negative: 5,
    negative: 4,
    neutral: 2,
    positive: 1,
    very_positive: 0,
  };

  const categoryImpact: Record<Category, number> = {
    bug: 5,
    performance: 4,
    feature_request: 3,
    ux: 3,
    pricing: 2,
    support: 2,
    documentation: 1,
    general: 1,
  };

  return items
    .map((item) => {
      const category = item.category ?? categorize(item.content);
      const sentiment = item.sentiment ?? analyzeSentiment(item.content).sentiment;
      const urgency = detectUrgency(item.content);

      const urgencyScore = { low: 1, medium: 2, high: 3, critical: 4 }[urgency];
      const impactScore = (sentimentImpact[sentiment] ?? 2) + (categoryImpact[category] ?? 1);

      const totalScore = urgencyScore * 2 + impactScore;
      let priority: PriorityLevel;
      if (totalScore >= 14) priority = 'critical';
      else if (totalScore >= 10) priority = 'high';
      else if (totalScore >= 6) priority = 'medium';
      else priority = 'low';

      return {
        content: item.content,
        category,
        priority,
        sentiment,
        urgency_score: urgencyScore,
        impact_score: impactScore,
      };
    })
    .sort((a, b) => (b.urgency_score * 2 + b.impact_score) - (a.urgency_score * 2 + a.impact_score));
}
