// ---------------------------------------------------------------------------
// follow-ups.ts -- CRUD for meet_follow_ups table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { FollowUp, FollowUpInsert } from '../types/index.js';

const TABLE = 'meet_follow_ups';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createFollowUp(data: FollowUpInsert): Promise<FollowUp> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create follow-up: ${error.message}`);
  return row as FollowUp;
}

export async function getFollowUpById(id: number): Promise<FollowUp | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get follow-up: ${error.message}`);
  return (data as FollowUp) ?? null;
}

export interface ListFollowUpsOptions {
  meeting_id?: number;
  action_item_id?: number;
  status?: 'pending' | 'sent' | 'failed';
  recipient?: string;
  limit?: number;
  offset?: number;
}

export async function listFollowUps(opts: ListFollowUpsOptions = {}): Promise<FollowUp[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('scheduled_for', { ascending: true });

  if (opts.meeting_id) query = query.eq('meeting_id', opts.meeting_id);
  if (opts.action_item_id) query = query.eq('action_item_id', opts.action_item_id);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.recipient) query = query.eq('recipient', opts.recipient);
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list follow-ups: ${error.message}`);
  return (data as FollowUp[]) ?? [];
}

export async function updateFollowUp(
  id: number,
  updates: Partial<FollowUpInsert> & { sent_at?: string | null },
): Promise<FollowUp> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update(updates)
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update follow-up: ${error.message}`);
  return data as FollowUp;
}

export async function getPendingFollowUps(): Promise<FollowUp[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true });
  if (error) throw new DatabaseError(`Failed to get pending follow-ups: ${error.message}`);
  return (data as FollowUp[]) ?? [];
}
