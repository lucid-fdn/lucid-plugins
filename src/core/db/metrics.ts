// ---------------------------------------------------------------------------
// metrics.ts -- MetricDefinition CRUD and computation
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { DatabaseError } from '../utils/errors.js';
import { isoNow } from '../utils/date.js';
import type { MetricDefinition, Aggregation } from '../types/index.js';

export interface CreateMetricParams {
  tenant_id: string;
  name: string;
  description?: string;
  event_name: string;
  aggregation?: Aggregation;
  filters?: Record<string, unknown>;
}

export async function createMetric(params: CreateMetricParams): Promise<MetricDefinition> {
  const db = getSupabase();
  const record = {
    tenant_id: params.tenant_id,
    name: params.name,
    description: params.description ?? '',
    event_name: params.event_name,
    aggregation: params.aggregation ?? 'count',
    filters: params.filters ?? {},
    created_at: isoNow(),
    updated_at: isoNow(),
  };

  const { data, error } = await db.from('metrics_definitions').insert(record).select().single();
  if (error) throw new DatabaseError(`Failed to create metric: ${error.message}`);
  return data as MetricDefinition;
}

export async function getMetricByName(tenantId: string, name: string): Promise<MetricDefinition | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_definitions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get metric: ${error.message}`);
  return (data as MetricDefinition) ?? null;
}

export async function listMetrics(tenantId: string): Promise<MetricDefinition[]> {
  const db = getSupabase();
  const { data, error } = await db.from('metrics_definitions').select('*').eq('tenant_id', tenantId);
  if (error) throw new DatabaseError(`Failed to list metrics: ${error.message}`);
  return (data ?? []) as MetricDefinition[];
}

export async function getMetricCount(tenantId: string): Promise<number> {
  const db = getSupabase();
  const { count, error } = await db
    .from('metrics_definitions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  if (error) throw new DatabaseError(`Failed to count metrics: ${error.message}`);
  return count ?? 0;
}
