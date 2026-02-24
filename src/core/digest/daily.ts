import type { Item, DigestPromptData } from '../types/index.js';
import { rankItems } from './ranker.js';
import { buildDigestSystemPrompt, buildDigestUserPrompt } from './prompts.js';

export interface BuildDailyDigestOptions {
  tenantId: string;
  language: string;
  timezone: string;
  date: string;
  items: Item[];
  sources: Map<number, { trust_score: number }>;
  maxItems: number;
}

/**
 * Build prompt data for a daily digest.
 *
 * This function ranks the provided items, selects the top N, and constructs
 * the system and user prompts that will be sent to the LLM by the OpenClaw
 * agent. It does NOT call the LLM itself.
 *
 * @param opts - Configuration and input data for the daily digest.
 * @returns DigestPromptData ready to be passed to the agent's LLM.
 */
export function buildDailyDigest(opts: BuildDailyDigestOptions): DigestPromptData {
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
    digestType: 'daily',
  });

  const userPrompt = buildDigestUserPrompt(topItems);

  return {
    systemPrompt,
    userPrompt,
    digestType: 'daily',
    date,
    itemCount: topItems.length,
  };
}
