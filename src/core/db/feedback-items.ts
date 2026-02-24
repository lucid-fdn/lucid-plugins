// ---------------------------------------------------------------------------
// feedback-items.ts -- CRUD for feedback_items table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { FeedbackItem, FeedbackItemInsert } from '../types/index.js';
import type { Channel, Sentiment, Category, FeedbackStatus, PriorityLevel } from '../types/index.js';

const TABLE = 'feedback_items';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createFeedbackItem(data: FeedbackItemInsert): Promise<FeedbackItem> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create feedback item: ${error.message}`);
  return row as FeedbackItem;
}

export async function getFeedbackById(id: number): Promise<FeedbackItem | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get feedback: ${error.message}`);
  return (data as FeedbackItem) ?? null;
}

export interface ListFeedbackOptions {
  channel?: Channel;
  sentiment?: Sentiment;
  category?: Category;
  status?: FeedbackStatus;
  priority?: PriorityLevel;
  query?: string;
  limit?: number;
  offset?: number;
}

export async function listFeedback(opts: ListFeedbackOptions = {}): Promise<FeedbackItem[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('created_at', { ascending: false });

  if (opts.channel) query = query.eq('channel', opts.channel);
  if (opts.sentiment) query = query.eq('sentiment', opts.sentiment);
  if (opts.category) query = query.eq('category', opts.category);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.priority) query = query.eq('priority', opts.priority);
  if (opts.query) query = query.ilike('content', `%${opts.query}%`);
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list feedback: ${error.message}`);
  return (data as FeedbackItem[]) ?? [];
}

export async function updateFeedbackItem(
  id: number,
  updates: Partial<FeedbackItemInsert> & {
    sentiment?: Sentiment;
    category?: Category;
    status?: FeedbackStatus;
    priority?: PriorityLevel;
    response?: string;
    responded_at?: string;
  },
): Promise<FeedbackItem> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update feedback: ${error.message}`);
  return data as FeedbackItem;
}

export async function getFeedbackWithNps(days?: number): Promise<FeedbackItem[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .not('nps_score', 'is', null)
    .order('created_at', { ascending: false });

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    query = query.gte('created_at', since.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to get NPS feedback: ${error.message}`);
  return (data as FeedbackItem[]) ?? [];
}

export async function getFeedbackByPriority(minPriority?: PriorityLevel, category?: Category): Promise<FeedbackItem[]> {
  const priorityOrder: PriorityLevel[] = ['low', 'medium', 'high', 'critical'];
  const minIdx = minPriority ? priorityOrder.indexOf(minPriority) : 0;
  const validPriorities = priorityOrder.slice(minIdx);

  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .in('priority', validPriorities)
    .eq('status', 'new')
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to get prioritized feedback: ${error.message}`);
  return (data as FeedbackItem[]) ?? [];
}

export async function countFeedback(opts: { channel?: Channel; since?: Date } = {}): Promise<number> {
  let query = getSupabase()
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId());

  if (opts.channel) query = query.eq('channel', opts.channel);
  if (opts.since) query = query.gte('created_at', opts.since.toISOString());

  const { count, error } = await query;
  if (error) throw new DatabaseError(`Failed to count feedback: ${error.message}`);
  return count ?? 0;
}
