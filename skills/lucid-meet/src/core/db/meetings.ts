// ---------------------------------------------------------------------------
// meetings.ts -- CRUD for meet_meetings table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { Meeting, MeetingInsert } from '../types/index.js';
import type { MeetingType, MeetingStatus } from '../types/index.js';

const TABLE = 'meet_meetings';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createMeeting(data: MeetingInsert): Promise<Meeting> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create meeting: ${error.message}`);
  return row as Meeting;
}

export async function getMeetingById(id: number): Promise<Meeting | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get meeting: ${error.message}`);
  return (data as Meeting) ?? null;
}

export interface ListMeetingsOptions {
  type?: MeetingType;
  status?: MeetingStatus;
  since?: string;
  limit?: number;
  offset?: number;
}

export async function listMeetings(opts: ListMeetingsOptions = {}): Promise<Meeting[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('scheduled_at', { ascending: false });

  if (opts.type) query = query.eq('type', opts.type);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.since) query = query.gte('scheduled_at', opts.since);
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list meetings: ${error.message}`);
  return (data as Meeting[]) ?? [];
}

export async function updateMeeting(
  id: number,
  updates: Partial<MeetingInsert> & { key_topics?: string[]; summary?: string | null },
): Promise<Meeting> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update meeting: ${error.message}`);
  return data as Meeting;
}

export async function deleteMeeting(id: number): Promise<void> {
  const { error } = await getSupabase().from(TABLE).delete().eq('tenant_id', tenantId()).eq('id', id);
  if (error) throw new DatabaseError(`Failed to delete meeting: ${error.message}`);
}

export async function getRecentMeetings(days: number): Promise<Meeting[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return listMeetings({ since: since.toISOString(), limit: 100 });
}
