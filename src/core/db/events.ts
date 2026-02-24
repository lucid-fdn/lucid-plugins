// ---------------------------------------------------------------------------
// events.ts -- Event ingestion and querying
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { DatabaseError } from '../utils/errors.js';
import { isoNow } from '../utils/date.js';
import type { MetricEvent, EventType } from '../types/index.js';

export interface IngestEventParams {
  tenant_id: string;
  event_name: string;
  event_type?: EventType;
  user_id?: string;
  session_id?: string;
  properties?: Record<string, unknown>;
}

export async function ingestEvent(params: IngestEventParams): Promise<MetricEvent> {
  const db = getSupabase();
  const record = {
    tenant_id: params.tenant_id,
    event_name: params.event_name,
    event_type: params.event_type ?? 'custom',
    user_id: params.user_id ?? null,
    session_id: params.session_id ?? null,
    properties: params.properties ?? {},
    timestamp: isoNow(),
    created_at: isoNow(),
  };

  const { data, error } = await db.from('metrics_events').insert(record).select().single();
  if (error) throw new DatabaseError(`Failed to ingest event: ${error.message}`);
  return data as MetricEvent;
}

export interface QueryEventsFilter {
  tenant_id: string;
  event_name?: string;
  event_type?: EventType;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export async function queryEvents(filters: QueryEventsFilter): Promise<MetricEvent[]> {
  const db = getSupabase();
  let query = db.from('metrics_events').select('*').eq('tenant_id', filters.tenant_id);

  if (filters.event_name) query = query.eq('event_name', filters.event_name);
  if (filters.event_type) query = query.eq('event_type', filters.event_type);
  if (filters.user_id) query = query.eq('user_id', filters.user_id);
  if (filters.start_date) query = query.gte('timestamp', filters.start_date);
  if (filters.end_date) query = query.lte('timestamp', filters.end_date);
  query = query.order('timestamp', { ascending: false }).limit(filters.limit ?? 1000);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to query events: ${error.message}`);
  return (data ?? []) as MetricEvent[];
}

export async function countEvents(tenantId: string, eventName?: string): Promise<number> {
  const db = getSupabase();
  let query = db.from('metrics_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId);
  if (eventName) query = query.eq('event_name', eventName);

  const { count, error } = await query;
  if (error) throw new DatabaseError(`Failed to count events: ${error.message}`);
  return count ?? 0;
}

export async function getUniqueUsers(tenantId: string, startDate?: string, endDate?: string): Promise<number> {
  const db = getSupabase();
  let query = db.from('metrics_events').select('user_id').eq('tenant_id', tenantId).not('user_id', 'is', null);
  if (startDate) query = query.gte('timestamp', startDate);
  if (endDate) query = query.lte('timestamp', endDate);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to get unique users: ${error.message}`);
  const unique = new Set((data ?? []).map((r: { user_id: string }) => r.user_id));
  return unique.size;
}
