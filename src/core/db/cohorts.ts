// ---------------------------------------------------------------------------
// cohorts.ts -- CohortDefinition CRUD
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { DatabaseError } from '../utils/errors.js';
import { isoNow } from '../utils/date.js';
import type { CohortDefinition, MetricPeriod } from '../types/index.js';

export interface CreateCohortParams {
  tenant_id: string;
  name: string;
  entry_event: string;
  return_event: string;
  period?: MetricPeriod;
}

export async function createCohort(params: CreateCohortParams): Promise<CohortDefinition> {
  const db = getSupabase();
  const record = {
    tenant_id: params.tenant_id,
    name: params.name,
    entry_event: params.entry_event,
    return_event: params.return_event,
    period: params.period ?? 'week',
    created_at: isoNow(),
    updated_at: isoNow(),
  };

  const { data, error } = await db.from('metrics_cohorts').insert(record).select().single();
  if (error) throw new DatabaseError(`Failed to create cohort: ${error.message}`);
  return data as CohortDefinition;
}

export async function getCohortByName(tenantId: string, name: string): Promise<CohortDefinition | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_cohorts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get cohort: ${error.message}`);
  return (data as CohortDefinition) ?? null;
}

export async function listCohorts(tenantId: string): Promise<CohortDefinition[]> {
  const db = getSupabase();
  const { data, error } = await db.from('metrics_cohorts').select('*').eq('tenant_id', tenantId);
  if (error) throw new DatabaseError(`Failed to list cohorts: ${error.message}`);
  return (data ?? []) as CohortDefinition[];
}
