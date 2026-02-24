// ---------------------------------------------------------------------------
// experiments.ts -- Experiment CRUD
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { DatabaseError } from '../utils/errors.js';
import { isoNow } from '../utils/date.js';
import type { Experiment, ExperimentStatus, ExperimentVariant } from '../types/index.js';

export interface CreateExperimentParams {
  tenant_id: string;
  name: string;
  description?: string;
  hypothesis?: string;
  status?: ExperimentStatus;
  variants?: ExperimentVariant[];
  metric_id?: string;
  start_date?: string;
  end_date?: string;
}

export async function createExperiment(params: CreateExperimentParams): Promise<Experiment> {
  const db = getSupabase();
  const record = {
    tenant_id: params.tenant_id,
    name: params.name,
    description: params.description ?? '',
    hypothesis: params.hypothesis ?? '',
    status: params.status ?? 'draft',
    variants: params.variants ?? [],
    metric_id: params.metric_id ?? '',
    start_date: params.start_date ?? null,
    end_date: params.end_date ?? null,
    results: null,
    created_at: isoNow(),
    updated_at: isoNow(),
  };

  const { data, error } = await db.from('metrics_experiments').insert(record).select().single();
  if (error) throw new DatabaseError(`Failed to create experiment: ${error.message}`);
  return data as Experiment;
}

export async function getExperimentById(id: string): Promise<Experiment | null> {
  const db = getSupabase();
  const { data, error } = await db.from('metrics_experiments').select('*').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get experiment: ${error.message}`);
  return (data as Experiment) ?? null;
}

export async function getExperimentByName(tenantId: string, name: string): Promise<Experiment | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_experiments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get experiment: ${error.message}`);
  return (data as Experiment) ?? null;
}

export async function updateExperiment(id: string, updates: Partial<Experiment>): Promise<Experiment> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_experiments')
    .update({ ...updates, updated_at: isoNow() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update experiment: ${error.message}`);
  return data as Experiment;
}

export async function listExperiments(tenantId: string, status?: ExperimentStatus): Promise<Experiment[]> {
  const db = getSupabase();
  let query = db.from('metrics_experiments').select('*').eq('tenant_id', tenantId);
  if (status) query = query.eq('status', status);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list experiments: ${error.message}`);
  return (data ?? []) as Experiment[];
}
