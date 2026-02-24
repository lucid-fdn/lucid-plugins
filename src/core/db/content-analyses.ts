// ---------------------------------------------------------------------------
// content-analyses.ts -- CRUD for seo_content_analyses table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { ContentAnalysis, ContentAnalysisInsert } from '../types/index.js';

const TABLE = 'seo_content_analyses';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createContentAnalysis(data: ContentAnalysisInsert): Promise<ContentAnalysis> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create content analysis: ${error.message}`);
  return row as ContentAnalysis;
}

export async function getContentAnalysisByUrl(url: string): Promise<ContentAnalysis | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('url', url)
    .order('analyzed_at', { ascending: false })
    .limit(1)
    .single();
  if (error && error.code !== 'PGRST116')
    throw new DatabaseError(`Failed to get content analysis: ${error.message}`);
  return (data as ContentAnalysis) ?? null;
}

export async function listContentAnalyses(limit = 20): Promise<ContentAnalysis[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('analyzed_at', { ascending: false })
    .limit(limit);
  if (error) throw new DatabaseError(`Failed to list content analyses: ${error.message}`);
  return (data as ContentAnalysis[]) ?? [];
}
