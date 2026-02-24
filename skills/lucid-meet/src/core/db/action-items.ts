// ---------------------------------------------------------------------------
// action-items.ts -- CRUD for meet_action_items table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { ActionItem, ActionItemInsert } from '../types/index.js';
import type { ActionStatus, ActionPriority } from '../types/index.js';

const TABLE = 'meet_action_items';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createActionItem(data: ActionItemInsert): Promise<ActionItem> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create action item: ${error.message}`);
  return row as ActionItem;
}

export async function getActionItemById(id: number): Promise<ActionItem | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116')
    throw new DatabaseError(`Failed to get action item: ${error.message}`);
  return (data as ActionItem) ?? null;
}

export interface ListActionItemsOptions {
  meeting_id?: number;
  assignee?: string;
  status?: ActionStatus;
  priority?: ActionPriority;
  overdue_only?: boolean;
  limit?: number;
  offset?: number;
}

export async function listActionItems(opts: ListActionItemsOptions = {}): Promise<ActionItem[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('created_at', { ascending: false });

  if (opts.meeting_id) query = query.eq('meeting_id', opts.meeting_id);
  if (opts.assignee) query = query.eq('assignee', opts.assignee);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.priority) query = query.eq('priority', opts.priority);
  if (opts.overdue_only) {
    query = query.lt('due_date', new Date().toISOString()).neq('status', 'completed').neq('status', 'cancelled');
  }
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list action items: ${error.message}`);
  return (data as ActionItem[]) ?? [];
}

export async function updateActionItem(
  id: number,
  updates: Partial<ActionItemInsert> & { completed_at?: string | null },
): Promise<ActionItem> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update action item: ${error.message}`);
  return data as ActionItem;
}

export async function getOverdueActionItems(): Promise<ActionItem[]> {
  return listActionItems({ overdue_only: true, limit: 500 });
}

export async function getPendingActionItems(): Promise<ActionItem[]> {
  return listActionItems({ status: 'pending', limit: 500 });
}
