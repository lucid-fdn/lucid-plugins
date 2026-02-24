// ---------------------------------------------------------------------------
// serp-results.ts -- CRUD for seo_serp_results table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { SerpResult, SerpResultInsert } from '../types/index.js';

const TABLE = 'seo_serp_results';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createSerpResult(data: SerpResultInsert): Promise<SerpResult> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create SERP result: ${error.message}`);
  return row as SerpResult;
}

export async function getSerpResultsForKeyword(keywordId: number, limit = 10): Promise<SerpResult[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('keyword_id', keywordId)
    .order('position', { ascending: true })
    .limit(limit);
  if (error) throw new DatabaseError(`Failed to get SERP results: ${error.message}`);
  return (data as SerpResult[]) ?? [];
}

export async function bulkCreateSerpResults(results: SerpResultInsert[]): Promise<SerpResult[]> {
  const rows = results.map((r) => ({ tenant_id: tenantId(), ...r }));
  const { data, error } = await getSupabase().from(TABLE).insert(rows).select();
  if (error) throw new DatabaseError(`Failed to bulk create SERP results: ${error.message}`);
  return (data as SerpResult[]) ?? [];
}
