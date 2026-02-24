// ---------------------------------------------------------------------------
// competitors.ts -- CRUD for seo_competitor_tracks table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { CompetitorTrack, CompetitorTrackInsert } from '../types/index.js';

const TABLE = 'seo_competitor_tracks';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createCompetitorTrack(data: CompetitorTrackInsert): Promise<CompetitorTrack> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create competitor track: ${error.message}`);
  return row as CompetitorTrack;
}

export async function getCompetitorTrack(
  competitorDomain: string,
  ourDomain: string,
): Promise<CompetitorTrack | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('domain', competitorDomain.toLowerCase())
    .eq('our_domain', ourDomain.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116')
    throw new DatabaseError(`Failed to get competitor track: ${error.message}`);
  return (data as CompetitorTrack) ?? null;
}

export async function listCompetitorTracks(ourDomain: string): Promise<CompetitorTrack[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('our_domain', ourDomain.toLowerCase())
    .order('overlap_pct', { ascending: false });
  if (error) throw new DatabaseError(`Failed to list competitor tracks: ${error.message}`);
  return (data as CompetitorTrack[]) ?? [];
}
