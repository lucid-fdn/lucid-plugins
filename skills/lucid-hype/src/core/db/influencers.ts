// ---------------------------------------------------------------------------
// influencers.ts -- CRUD for hype_influencers table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { Influencer, InfluencerInsert } from '../types/index.js';
import type { Platform } from '../types/index.js';

const TABLE = 'hype_influencers';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createInfluencer(data: InfluencerInsert): Promise<Influencer> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create influencer: ${error.message}`);
  return row as Influencer;
}

export interface ListInfluencersOptions {
  platform?: Platform;
  niche?: string;
  minFollowers?: number;
  limit?: number;
  offset?: number;
}

export async function listInfluencers(
  opts: ListInfluencersOptions = {},
): Promise<Influencer[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('relevance_score', { ascending: false });

  if (opts.platform) query = query.eq('platform', opts.platform);
  if (opts.niche) query = query.contains('niche', [opts.niche]);
  if (opts.minFollowers) query = query.gte('followers', opts.minFollowers);
  query = query.range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list influencers: ${error.message}`);
  return (data as Influencer[]) ?? [];
}

export async function updateInfluencer(
  id: string,
  updates: Partial<InfluencerInsert>,
): Promise<Influencer> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to update influencer: ${error.message}`);
  return data as Influencer;
}
