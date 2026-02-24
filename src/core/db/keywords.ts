// ---------------------------------------------------------------------------
// keywords.ts -- CRUD for seo_keywords table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { Keyword, KeywordInsert } from '../types/index.js';

const TABLE = 'seo_keywords';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createKeyword(data: KeywordInsert): Promise<Keyword> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create keyword: ${error.message}`);
  return row as Keyword;
}

export async function getKeywordByText(keyword: string): Promise<Keyword | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('keyword', keyword.toLowerCase())
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get keyword: ${error.message}`);
  return (data as Keyword) ?? null;
}

export interface ListKeywordsOptions {
  intent?: string;
  limit?: number;
  offset?: number;
}

export async function listKeywords(opts: ListKeywordsOptions = {}): Promise<Keyword[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('search_volume', { ascending: false });

  if (opts.intent) query = query.eq('intent', opts.intent);
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list keywords: ${error.message}`);
  return (data as Keyword[]) ?? [];
}

export async function upsertKeyword(data: KeywordInsert): Promise<Keyword> {
  const existing = await getKeywordByText(data.keyword);
  if (existing) {
    const { data: row, error } = await getSupabase()
      .from(TABLE)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId())
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new DatabaseError(`Failed to update keyword: ${error.message}`);
    return row as Keyword;
  }
  return createKeyword({ ...data, keyword: data.keyword.toLowerCase() });
}

export async function updateKeywordRank(
  keywordId: number,
  rank: number | null,
  url: string | null,
): Promise<void> {
  const { error } = await getSupabase()
    .from(TABLE)
    .update({
      previous_rank: null,
      current_rank: rank,
      url,
      tracked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId())
    .eq('id', keywordId);
  if (error) throw new DatabaseError(`Failed to update keyword rank: ${error.message}`);
}
