// ---------------------------------------------------------------------------
// campaigns.ts -- CRUD for hype_campaigns table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { Campaign, CampaignInsert } from '../types/index.js';
import type { CampaignStatus, Platform } from '../types/index.js';

const TABLE = 'hype_campaigns';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createCampaign(data: CampaignInsert): Promise<Campaign> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create campaign: ${error.message}`);
  return row as Campaign;
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116')
    throw new DatabaseError(`Failed to get campaign: ${error.message}`);
  return (data as Campaign) ?? null;
}

export interface ListCampaignsOptions {
  status?: CampaignStatus;
  platform?: Platform;
  limit?: number;
  offset?: number;
}

export async function listCampaigns(opts: ListCampaignsOptions = {}): Promise<Campaign[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('updated_at', { ascending: false });

  if (opts.status) query = query.eq('status', opts.status);
  if (opts.platform) query = query.contains('platforms', [opts.platform]);
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list campaigns: ${error.message}`);
  return (data as Campaign[]) ?? [];
}

export async function updateCampaign(
  id: string,
  updates: Partial<CampaignInsert>,
): Promise<Campaign> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update campaign: ${error.message}`);
  return data as Campaign;
}
