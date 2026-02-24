// ---------------------------------------------------------------------------
// trend-detector.ts -- Trend detection, anomaly detection, NPS calculation
// ---------------------------------------------------------------------------

import type { FeedbackItem } from '../types/database.js';
import type { Sentiment, Category } from '../types/common.js';
import { extractThemes } from './sentiment-analyzer.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TrendData {
  period: string;
  category: Category | null;
  sentiment_avg: number;
  volume: number;
  nps_score: number | null;
  top_themes: string[];
  change_pct: number | null;
}

export interface Anomaly {
  type: 'volume_spike' | 'sentiment_drop' | 'nps_drop' | 'category_surge';
  description: string;
  severity: 'low' | 'medium' | 'high';
  value: number;
  expected: number;
}

export interface NpsResult {
  nps: number;
  detractors: number;
  passives: number;
  promoters: number;
  total: number;
  detractor_pct: number;
  passive_pct: number;
  promoter_pct: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SENTIMENT_SCORES: Record<Sentiment, number> = {
  very_negative: -1,
  negative: -0.5,
  neutral: 0,
  positive: 0.5,
  very_positive: 1,
};

function avgSentiment(items: FeedbackItem[]): number {
  const scored = items.filter((i) => i.sentiment);
  if (scored.length === 0) return 0;
  const sum = scored.reduce((acc, i) => acc + (SENTIMENT_SCORES[i.sentiment!] ?? 0), 0);
  return sum / scored.length;
}

function groupByPeriod(items: FeedbackItem[], periodDays: number): Map<string, FeedbackItem[]> {
  const groups = new Map<string, FeedbackItem[]>();
  for (const item of items) {
    const d = new Date(item.created_at);
    let key: string;
    if (periodDays <= 1) {
      key = d.toISOString().split('T')[0];
    } else if (periodDays <= 7) {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const arr = groups.get(key) ?? [];
    arr.push(item);
    groups.set(key, arr);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

/**
 * Detect trends from feedback items over a time period.
 */
export function detectTrends(items: FeedbackItem[], periodDays: number): TrendData[] {
  const groups = groupByPeriod(items, periodDays);
  const sortedKeys = [...groups.keys()].sort();
  const trends: TrendData[] = [];
  let prevVolume: number | null = null;

  for (const key of sortedKeys) {
    const periodItems = groups.get(key)!;
    const sentiment = avgSentiment(periodItems);
    const npsItems = periodItems.filter((i) => i.nps_score !== null);
    const nps = npsItems.length > 0 ? calculateNps(npsItems.map((i) => i.nps_score!)).nps : null;
    const themes = extractThemes(periodItems).slice(0, 5);
    const changePct = prevVolume !== null && prevVolume > 0
      ? ((periodItems.length - prevVolume) / prevVolume) * 100
      : null;

    trends.push({
      period: key,
      category: null,
      sentiment_avg: Math.round(sentiment * 100) / 100,
      volume: periodItems.length,
      nps_score: nps !== null ? Math.round(nps) : null,
      top_themes: themes.map((t) => t.name),
      change_pct: changePct !== null ? Math.round(changePct * 10) / 10 : null,
    });

    prevVolume = periodItems.length;
  }

  return trends;
}

/**
 * Find anomalies by comparing current period to historical averages.
 */
export function findAnomalies(
  current: { volume: number; sentiment_avg: number; nps_score: number | null },
  historical: Array<{ volume: number; sentiment_avg: number; nps_score: number | null }>,
): Anomaly[] {
  if (historical.length === 0) return [];

  const anomalies: Anomaly[] = [];

  // Average historical values
  const avgVolume = historical.reduce((a, b) => a + b.volume, 0) / historical.length;
  const avgSent = historical.reduce((a, b) => a + b.sentiment_avg, 0) / historical.length;
  const npsValues = historical.filter((h) => h.nps_score !== null).map((h) => h.nps_score!);
  const avgNps = npsValues.length > 0 ? npsValues.reduce((a, b) => a + b, 0) / npsValues.length : null;

  // Volume spike: > 2x historical average
  if (avgVolume > 0 && current.volume > avgVolume * 2) {
    anomalies.push({
      type: 'volume_spike',
      description: `Feedback volume is ${((current.volume / avgVolume) * 100).toFixed(0)}% of average`,
      severity: current.volume > avgVolume * 3 ? 'high' : 'medium',
      value: current.volume,
      expected: Math.round(avgVolume),
    });
  }

  // Sentiment drop: > 0.3 below average
  if (current.sentiment_avg < avgSent - 0.3) {
    anomalies.push({
      type: 'sentiment_drop',
      description: `Sentiment dropped to ${current.sentiment_avg.toFixed(2)} (avg: ${avgSent.toFixed(2)})`,
      severity: current.sentiment_avg < avgSent - 0.6 ? 'high' : 'medium',
      value: current.sentiment_avg,
      expected: Math.round(avgSent * 100) / 100,
    });
  }

  // NPS drop: > 15 points below average
  if (avgNps !== null && current.nps_score !== null && current.nps_score < avgNps - 15) {
    anomalies.push({
      type: 'nps_drop',
      description: `NPS dropped to ${current.nps_score} (avg: ${avgNps.toFixed(0)})`,
      severity: current.nps_score < avgNps - 30 ? 'high' : 'medium',
      value: current.nps_score,
      expected: Math.round(avgNps),
    });
  }

  return anomalies;
}

/**
 * Calculate NPS score from an array of NPS ratings (0-10).
 */
export function calculateNps(scores: number[]): NpsResult {
  if (scores.length === 0) {
    return { nps: 0, detractors: 0, passives: 0, promoters: 0, total: 0, detractor_pct: 0, passive_pct: 0, promoter_pct: 0 };
  }

  let detractors = 0;
  let passives = 0;
  let promoters = 0;

  for (const score of scores) {
    if (score <= 6) detractors++;
    else if (score <= 8) passives++;
    else promoters++;
  }

  const total = scores.length;
  const detractor_pct = (detractors / total) * 100;
  const passive_pct = (passives / total) * 100;
  const promoter_pct = (promoters / total) * 100;
  const nps = Math.round(promoter_pct - detractor_pct);

  return { nps, detractors, passives, promoters, total, detractor_pct, passive_pct, promoter_pct };
}
