// ---------------------------------------------------------------------------
// competitor-analyzer.ts -- Competitive intelligence logic
// ---------------------------------------------------------------------------

import type { KeywordData, CompetitorData } from '../types/provider.js';

export interface CompetitorOverlap {
  competitor_domain: string;
  our_domain: string;
  shared_keywords: number;
  competitor_only: number;
  our_only: number;
  overlap_pct: number;
}

export interface ContentGap {
  keyword: string;
  competitor_rank: number;
  search_volume: number;
  difficulty: number;
  opportunity_score: number;
}

export interface VisibilityComparison {
  our_domain: string;
  competitor_domain: string;
  our_visibility: number;
  competitor_visibility: number;
  difference: number;
}

export function analyzeOverlap(
  ourKeywords: string[],
  competitorKeywords: string[],
): CompetitorOverlap {
  const ourSet = new Set(ourKeywords.map((k) => k.toLowerCase()));
  const compSet = new Set(competitorKeywords.map((k) => k.toLowerCase()));

  const shared = [...ourSet].filter((k) => compSet.has(k));
  const competitorOnly = [...compSet].filter((k) => !ourSet.has(k));
  const ourOnly = [...ourSet].filter((k) => !compSet.has(k));

  const totalUnique = new Set([...ourSet, ...compSet]).size;
  const overlapPct = totalUnique > 0 ? (shared.length / totalUnique) * 100 : 0;

  return {
    competitor_domain: '',
    our_domain: '',
    shared_keywords: shared.length,
    competitor_only: competitorOnly.length,
    our_only: ourOnly.length,
    overlap_pct: Math.round(overlapPct * 100) / 100,
  };
}

export function findContentGaps(
  ourKeywords: string[],
  competitorKeywordData: KeywordData[],
): ContentGap[] {
  const ourSet = new Set(ourKeywords.map((k) => k.toLowerCase()));

  return competitorKeywordData
    .filter((kd) => !ourSet.has(kd.keyword.toLowerCase()))
    .map((kd) => ({
      keyword: kd.keyword,
      competitor_rank: kd.difficulty, // Approximation
      search_volume: kd.search_volume,
      difficulty: kd.difficulty,
      opportunity_score: calculateOpportunityScore(kd.search_volume, kd.difficulty, kd.cpc),
    }))
    .sort((a, b) => b.opportunity_score - a.opportunity_score);
}

export function calculateOpportunityScore(volume: number, difficulty: number, cpc: number): number {
  // High volume + low difficulty + high CPC = high opportunity
  const volumeScore = Math.min(volume / 10_000, 1) * 40;
  const difficultyScore = ((100 - difficulty) / 100) * 35;
  const cpcScore = Math.min(cpc / 5, 1) * 25;

  return Math.round(volumeScore + difficultyScore + cpcScore);
}

export function compareVisibility(
  ourDomain: string,
  competitorDomain: string,
  ourScore: number,
  competitorScore: number,
): VisibilityComparison {
  return {
    our_domain: ourDomain,
    competitor_domain: competitorDomain,
    our_visibility: ourScore,
    competitor_visibility: competitorScore,
    difference: Math.round((ourScore - competitorScore) * 100) / 100,
  };
}

export function getCompetitorAdvantages(
  competitorData: CompetitorData[],
): Array<{ domain: string; advantage: string; score: number }> {
  return competitorData
    .filter((c) => c.visibility_score > 0)
    .map((c) => ({
      domain: c.domain,
      advantage:
        c.competitor_keywords > c.shared_keywords * 2
          ? 'Broad keyword coverage'
          : c.visibility_score > 50
            ? 'High visibility'
            : 'Moderate presence',
      score: c.visibility_score,
    }))
    .sort((a, b) => b.score - a.score);
}
