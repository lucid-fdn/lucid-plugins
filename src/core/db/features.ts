// ---------------------------------------------------------------------------
// features.ts -- Feature tracking CRUD
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { DatabaseError } from '../utils/errors.js';
import { isoNow } from '../utils/date.js';
import type { Feature, FeatureStatus } from '../types/index.js';

export interface CreateFeatureParams {
  tenant_id: string;
  name: string;
  description?: string;
  status?: FeatureStatus;
  adoption_metric_id?: string;
}

export async function createFeature(params: CreateFeatureParams): Promise<Feature> {
  const db = getSupabase();
  const record = {
    tenant_id: params.tenant_id,
    name: params.name,
    description: params.description ?? '',
    status: params.status ?? 'planned',
    adoption_metric_id: params.adoption_metric_id ?? null,
    created_at: isoNow(),
    updated_at: isoNow(),
  };

  const { data, error } = await db.from('metrics_features').insert(record).select().single();
  if (error) throw new DatabaseError(`Failed to create feature: ${error.message}`);
  return data as Feature;
}

export async function getFeatureByName(tenantId: string, name: string): Promise<Feature | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_features')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get feature: ${error.message}`);
  return (data as Feature) ?? null;
}

export async function updateFeature(id: string, updates: Partial<Feature>): Promise<Feature> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_features')
    .update({ ...updates, updated_at: isoNow() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update feature: ${error.message}`);
  return data as Feature;
}

export async function listFeatures(tenantId: string, status?: FeatureStatus): Promise<Feature[]> {
  const db = getSupabase();
  let query = db.from('metrics_features').select('*').eq('tenant_id', tenantId);
  if (status) query = query.eq('status', status);
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list features: ${error.message}`);
  return (data ?? []) as Feature[];
}
