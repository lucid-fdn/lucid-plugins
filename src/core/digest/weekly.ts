import type { Item, DigestPromptData } from '../types/index.js';
import { rankItems } from './ranker.js';
import { buildDigestSystemPrompt, buildDigestUserPrompt } from './prompts.js';

export interface BuildWeeklyDigestOptions {
  tenantId: string;
  language: string;
  timezone: string;
  date: string;
  items: Item[];
  sources: Map<number, { trust_score: number }>;
  maxItems: number;
}

/**
 * Build prompt data for a weekly digest.
 *
 * Same structure as the daily digest builder but configured for a weekly
 * cadence. The system prompt explicitly mentions a 7-day coverage window,
 * which encourages the LLM to identify broader trends and patterns.
 *
 * @param opts - Configuration and input data for the weekly digest.
 * @returns DigestPromptData ready to be passed to the agent's LLM.
 */
export function buildWeeklyDigest(opts: BuildWeeklyDigestOptions): DigestPromptData {
  const { language, timezone, date, items, sources, maxItems } = opts;

  // Rank all candidate items
  const ranked = rankItems(items, sources);

  // Select top N items
  const topItems = ranked.slice(0, maxItems);

  // Build prompts
  const systemPrompt = buildDigestSystemPrompt({
    language,
    timezone,
    date,
    digestType: 'weekly',
  });

  const userPrompt = buildDigestUserPrompt(topItems);

  return {
    systemPrompt,
    userPrompt,
    digestType: 'weekly',
    date,
    itemCount: topItems.length,
  };
}
