// ---------------------------------------------------------------------------
// responses.ts -- CRUD for feedback_responses table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { FeedbackResponse, FeedbackResponseInsert } from '../types/index.js';

const TABLE = 'feedback_responses';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createResponse(data: FeedbackResponseInsert): Promise<FeedbackResponse> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create response: ${error.message}`);
  return row as FeedbackResponse;
}

export async function getResponsesByFeedbackId(feedbackId: number): Promise<FeedbackResponse[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('feedback_id', feedbackId)
    .order('created_at', { ascending: false });
  if (error) throw new DatabaseError(`Failed to get responses: ${error.message}`);
  return (data as FeedbackResponse[]) ?? [];
}

export async function countResponses(opts: { since?: Date } = {}): Promise<number> {
  let query = getSupabase()
    .from(TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId());

  if (opts.since) query = query.gte('created_at', opts.since.toISOString());

  const { count, error } = await query;
  if (error) throw new DatabaseError(`Failed to count responses: ${error.message}`);
  return count ?? 0;
}
