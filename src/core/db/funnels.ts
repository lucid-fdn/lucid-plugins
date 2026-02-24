// ---------------------------------------------------------------------------
// funnels.ts -- FunnelDefinition and FunnelResult CRUD
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { DatabaseError } from '../utils/errors.js';
import { isoNow } from '../utils/date.js';
import type { FunnelDefinition, FunnelResult, FunnelStep } from '../types/index.js';

export interface CreateFunnelParams {
  tenant_id: string;
  name: string;
  steps: FunnelStep[];
  conversion_window?: number;
}

export async function createFunnel(params: CreateFunnelParams): Promise<FunnelDefinition> {
  const db = getSupabase();
  const record = {
    tenant_id: params.tenant_id,
    name: params.name,
    steps: params.steps,
    conversion_window: params.conversion_window ?? 72,
    created_at: isoNow(),
    updated_at: isoNow(),
  };

  const { data, error } = await db.from('metrics_funnels').insert(record).select().single();
  if (error) throw new DatabaseError(`Failed to create funnel: ${error.message}`);
  return data as FunnelDefinition;
}

export async function getFunnelByName(tenantId: string, name: string): Promise<FunnelDefinition | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_funnels')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('name', name)
    .single();

  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get funnel: ${error.message}`);
  return (data as FunnelDefinition) ?? null;
}

export async function listFunnels(tenantId: string): Promise<FunnelDefinition[]> {
  const db = getSupabase();
  const { data, error } = await db.from('metrics_funnels').select('*').eq('tenant_id', tenantId);
  if (error) throw new DatabaseError(`Failed to list funnels: ${error.message}`);
  return (data ?? []) as FunnelDefinition[];
}

export async function saveFunnelResult(result: Omit<FunnelResult, 'id' | 'created_at'>): Promise<FunnelResult> {
  const db = getSupabase();
  const { data, error } = await db
    .from('metrics_funnel_results')
    .insert({ ...result, created_at: isoNow() })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to save funnel result: ${error.message}`);
  return data as FunnelResult;
}

export async function getFunnelResults(
  funnelId: string,
  startDate?: string,
  endDate?: string,
): Promise<FunnelResult[]> {
  const db = getSupabase();
  let query = db.from('metrics_funnel_results').select('*').eq('funnel_id', funnelId);
  if (startDate) query = query.gte('period_start', startDate);
  if (endDate) query = query.lte('period_end', endDate);
  query = query.order('period_start', { ascending: false });

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to get funnel results: ${error.message}`);
  return (data ?? []) as FunnelResult[];
}
