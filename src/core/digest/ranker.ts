import type { Item, RankedItem } from '../types/index.js';

/**
 * Half-life for recency decay in days.
 * An item published today scores 1.0; an item published 3 days ago scores ~0.5.
 */
const RECENCY_HALF_LIFE_DAYS = 3;

/** Weight for the relevance component. */
const WEIGHT_RELEVANCE = 0.4;
/** Weight for the trust component. */
const WEIGHT_TRUST = 0.35;
/** Weight for the recency component. */
const WEIGHT_RECENCY = 0.25;

/** Default relevance score when the item has no score assigned. */
const DEFAULT_RELEVANCE = 0.5;

/**
 * Compute an exponential-decay recency score based on item age in days.
 *
 * Formula: 2^(-ageDays / halfLifeDays)
 *  - 0 days old  -> 1.0
 *  - 3 days old  -> ~0.5
 *  - 6 days old  -> ~0.25
 *  - 9 days old  -> ~0.125
 */
function computeRecencyScore(item: Item): number {
  const referenceDate = item.published_at ?? item.created_at;
  const itemDate = new Date(referenceDate);

  if (isNaN(itemDate.getTime())) {
    // If neither date is valid, treat as moderately old
    return 0.25;
  }

  const now = new Date();
  const ageDays = Math.max(0, (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

  return Math.pow(2, -ageDays / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Normalize an item's relevance_score to the 0-1 range.
 * If the item has no relevance_score, returns DEFAULT_RELEVANCE.
 */
function computeRelevanceScore(item: Item): number {
  if (item.relevance_score === null || item.relevance_score === undefined) {
    return DEFAULT_RELEVANCE;
  }

  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, item.relevance_score));
}

/**
 * Compute the trust score from a source's trust_score (0-100 scale).
 * Returns 0.5 (neutral trust) if the source is unknown.
 */
function computeTrustScore(
  item: Item,
  sources: Map<number, { trust_score: number }>,
): number {
  if (item.source_id === null) {
    return 0.5;
  }

  const source = sources.get(item.source_id);
  if (!source) {
    return 0.5;
  }

  return Math.max(0, Math.min(1, source.trust_score / 100));
}

/**
 * Rank a list of items by a composite score combining relevance, trust, and
 * recency.
 *
 * Formula: score = 0.4 * relevance + 0.35 * trust + 0.25 * recency
 *
 * @param items - The items to rank.
 * @param sources - A map of source_id to source metadata (at minimum trust_score).
 * @returns Items wrapped in RankedItem objects, sorted descending by score.
 */
export function rankItems(
  items: Item[],
  sources: Map<number, { trust_score: number }>,
): RankedItem[] {
  const ranked: RankedItem[] = items.map((item) => {
    const relevanceScore = computeRelevanceScore(item);
    const trustScore = computeTrustScore(item, sources);
    const recencyScore = computeRecencyScore(item);

    const score =
      WEIGHT_RELEVANCE * relevanceScore +
      WEIGHT_TRUST * trustScore +
      WEIGHT_RECENCY * recencyScore;

    return {
      item,
      score,
      trustScore,
      recencyScore,
      relevanceScore,
    };
  });

  // Sort descending by composite score
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}
