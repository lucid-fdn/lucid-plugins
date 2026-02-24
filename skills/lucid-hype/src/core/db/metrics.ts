// ---------------------------------------------------------------------------
// metrics.ts -- CRUD for hype_metrics table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { EngagementMetric, EngagementMetricInsert } from '../types/index.js';

const TABLE = 'hype_metrics';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createMetric(data: EngagementMetricInsert): Promise<EngagementMetric> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create metric: ${error.message}`);
  return row as EngagementMetric;
}

export async function listMetricsByPost(postId: string): Promise<EngagementMetric[]> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('post_id', postId)
    .order('recorded_at', { ascending: false });

  if (error) throw new DatabaseError(`Failed to list metrics: ${error.message}`);
  return (data as EngagementMetric[]) ?? [];
}
