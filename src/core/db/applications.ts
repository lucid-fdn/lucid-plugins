import type { SupabaseClient } from '@supabase/supabase-js';
import type { Application, CandidateStage } from '../types/index.js';
import { RecruitError } from '../utils/errors.js';
import { nowISO } from '../utils/date.js';

const TABLE = 'recruit_applications';

export async function createApplication(
  client: SupabaseClient,
  data: Omit<Application, 'id' | 'created_at' | 'updated_at'>,
): Promise<Application> {
  const now = nowISO();
  const { data: app, error } = await client
    .from(TABLE)
    .insert({ ...data, created_at: now, updated_at: now })
    .select()
    .single();

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return app as Application;
}

export async function getApplication(client: SupabaseClient, id: string): Promise<Application> {
  const { data, error } = await client.from(TABLE).select('*').eq('id', id).single();
  if (error || !data) throw RecruitError.notFound('Application', id);
  return data as Application;
}

export async function listApplications(
  client: SupabaseClient,
  tenantId: string,
  filters?: { jobId?: string; candidateId?: string; stage?: CandidateStage },
): Promise<Application[]> {
  let q = client.from(TABLE).select('*').eq('tenant_id', tenantId);

  if (filters?.jobId) q = q.eq('job_id', filters.jobId);
  if (filters?.candidateId) q = q.eq('candidate_id', filters.candidateId);
  if (filters?.stage) q = q.eq('stage', filters.stage);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return (data ?? []) as Application[];
}

export async function updateApplicationStage(
  client: SupabaseClient,
  id: string,
  stage: CandidateStage,
  rejectionReason?: string,
): Promise<Application> {
  const now = nowISO();
  const updates: Record<string, unknown> = {
    stage,
    stage_changed_at: now,
    updated_at: now,
  };
  if (rejectionReason) updates['rejection_reason'] = rejectionReason;

  const { data, error } = await client
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw RecruitError.notFound('Application', id);
  return data as Application;
}

export async function updateApplicationScore(
  client: SupabaseClient,
  id: string,
  score: number,
  matchScore: number,
): Promise<Application> {
  const { data, error } = await client
    .from(TABLE)
    .update({ score, match_score: matchScore, updated_at: nowISO() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw RecruitError.notFound('Application', id);
  return data as Application;
}
