// ---------------------------------------------------------------------------
// backlinks.ts -- CRUD for seo_backlink_profiles and seo_backlinks tables
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { BacklinkProfile, BacklinkProfileInsert, Backlink, BacklinkInsert } from '../types/index.js';

const PROFILES_TABLE = 'seo_backlink_profiles';
const LINKS_TABLE = 'seo_backlinks';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function upsertBacklinkProfile(data: BacklinkProfileInsert): Promise<BacklinkProfile> {
  const existing = await getBacklinkProfileByDomain(data.domain);
  if (existing) {
    const { data: row, error } = await getSupabase()
      .from(PROFILES_TABLE)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('tenant_id', tenantId())
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw new DatabaseError(`Failed to update backlink profile: ${error.message}`);
    return row as BacklinkProfile;
  }
  const { data: row, error } = await getSupabase()
    .from(PROFILES_TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create backlink profile: ${error.message}`);
  return row as BacklinkProfile;
}

export async function getBacklinkProfileByDomain(domain: string): Promise<BacklinkProfile | null> {
  const { data, error } = await getSupabase()
    .from(PROFILES_TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('domain', domain.toLowerCase())
    .single();
  if (error && error.code !== 'PGRST116')
    throw new DatabaseError(`Failed to get backlink profile: ${error.message}`);
  return (data as BacklinkProfile) ?? null;
}

export async function createBacklink(data: BacklinkInsert): Promise<Backlink> {
  const { data: row, error } = await getSupabase().from(LINKS_TABLE).insert(data).select().single();
  if (error) throw new DatabaseError(`Failed to create backlink: ${error.message}`);
  return row as Backlink;
}

export async function getBacklinksForProfile(profileId: number, limit = 50): Promise<Backlink[]> {
  const { data, error } = await getSupabase()
    .from(LINKS_TABLE)
    .select()
    .eq('profile_id', profileId)
    .eq('is_lost', false)
    .order('last_seen', { ascending: false })
    .limit(limit);
  if (error) throw new DatabaseError(`Failed to get backlinks: ${error.message}`);
  return (data as Backlink[]) ?? [];
}
