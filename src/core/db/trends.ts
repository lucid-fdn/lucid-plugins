// ---------------------------------------------------------------------------
// trends.ts -- CRUD for feedback_trends table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { FeedbackTrend, FeedbackTrendInsert } from '../types/index.js';
import type { Category } from '../types/index.js';

const TABLE = 'feedback_trends';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createTrend(data: FeedbackTrendInsert): Promise<FeedbackTrend> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create trend: ${error.message}`);
  return row as FeedbackTrend;
}

export async function listTrends(opts: {
  period?: string;
  category?: Category;
  limit?: number;
} = {}): Promise<FeedbackTrend[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('created_at', { ascending: false });

  if (opts.period) query = query.eq('period', opts.period);
  if (opts.category) query = query.eq('category', opts.category);
  query = query.limit(opts.limit ?? 50);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list trends: ${error.message}`);
  return (data as FeedbackTrend[]) ?? [];
}

export async function getLatestTrend(period: string, category?: Category): Promise<FeedbackTrend | null> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('period', period)
    .order('created_at', { ascending: false })
    .limit(1);
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to get latest trend: ${error.message}`);
  return (data as FeedbackTrend[])?.[0] ?? null;
}
