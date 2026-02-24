import type { SupabaseClient } from '@supabase/supabase-js';
import type { Job, JobStatus } from '../types/index.js';
import { RecruitError } from '../utils/errors.js';
import { nowISO } from '../utils/date.js';

const TABLE = 'recruit_jobs';

export async function createJob(
  client: SupabaseClient,
  data: Omit<Job, 'id' | 'created_at' | 'updated_at'>,
): Promise<Job> {
  const now = nowISO();
  const { data: job, error } = await client
    .from(TABLE)
    .insert({ ...data, created_at: now, updated_at: now })
    .select()
    .single();

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return job as Job;
}

export async function getJob(client: SupabaseClient, id: string): Promise<Job> {
  const { data, error } = await client.from(TABLE).select('*').eq('id', id).single();
  if (error || !data) throw RecruitError.notFound('Job', id);
  return data as Job;
}

export async function listJobs(
  client: SupabaseClient,
  tenantId: string,
  status?: JobStatus,
): Promise<Job[]> {
  let query = client.from(TABLE).select('*').eq('tenant_id', tenantId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return (data ?? []) as Job[];
}

export async function updateJob(
  client: SupabaseClient,
  id: string,
  updates: Partial<Job>,
): Promise<Job> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: nowISO() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw RecruitError.notFound('Job', id);
  return data as Job;
}
