import type { SupabaseClient } from '@supabase/supabase-js';
import type { ContentBlock } from '../types/database.js';
import { ProposeError } from '../utils/errors.js';
import { now } from '../utils/date.js';

const TABLE = 'propose_content_blocks';

export interface CreateContentBlockInput {
  tenant_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export async function createContentBlock(
  db: SupabaseClient,
  input: CreateContentBlockInput,
): Promise<ContentBlock> {
  const record = {
    ...input,
    usage_count: 0,
    created_at: now(),
    updated_at: now(),
  };

  const { data, error } = await db.from(TABLE).insert(record).select().single();

  if (error) {
    throw ProposeError.internal(`Failed to create content block: ${error.message}`);
  }

  return data as ContentBlock;
}

export async function searchContentBlocks(
  db: SupabaseClient,
  tenantId: string,
  query: string,
  category?: string,
): Promise<ContentBlock[]> {
  let dbQuery = db
    .from(TABLE)
    .select('*')
    .eq('tenant_id', tenantId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  dbQuery = dbQuery.order('usage_count', { ascending: false }).limit(20);

  const { data, error } = await dbQuery;

  if (error) {
    throw ProposeError.internal(`Failed to search content blocks: ${error.message}`);
  }

  return (data ?? []) as ContentBlock[];
}

export async function incrementBlockUsage(db: SupabaseClient, id: string): Promise<void> {
  const { data, error } = await db.from(TABLE).select('usage_count').eq('id', id).single();

  if (error || !data) return;

  const current = (data as { usage_count: number }).usage_count;
  await db
    .from(TABLE)
    .update({ usage_count: current + 1, updated_at: now() })
    .eq('id', id);
}
