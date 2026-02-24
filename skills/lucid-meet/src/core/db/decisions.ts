// ---------------------------------------------------------------------------
// decisions.ts -- CRUD for meet_decisions table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { Decision, DecisionInsert } from '../types/index.js';

const TABLE = 'meet_decisions';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createDecision(data: DecisionInsert): Promise<Decision> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create decision: ${error.message}`);
  return row as Decision;
}

export async function getDecisionById(id: number): Promise<Decision | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get decision: ${error.message}`);
  return (data as Decision) ?? null;
}

export interface ListDecisionsOptions {
  meeting_id?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function listDecisions(opts: ListDecisionsOptions = {}): Promise<Decision[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('created_at', { ascending: false });

  if (opts.meeting_id) query = query.eq('meeting_id', opts.meeting_id);
  if (opts.status) query = query.eq('status', opts.status);
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list decisions: ${error.message}`);
  return (data as Decision[]) ?? [];
}

export async function updateDecision(id: number, updates: Partial<DecisionInsert>): Promise<Decision> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update decision: ${error.message}`);
  return data as Decision;
}
