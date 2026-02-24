import type { SupabaseClient } from '@supabase/supabase-js';
import type { InterviewSchedule } from '../types/index.js';
import { RecruitError } from '../utils/errors.js';

const TABLE = 'recruit_interviews';

export async function createInterview(
  client: SupabaseClient,
  data: InterviewSchedule,
): Promise<InterviewSchedule> {
  const { data: interview, error } = await client
    .from(TABLE)
    .insert(data)
    .select()
    .single();

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return interview as InterviewSchedule;
}

export async function listInterviews(
  client: SupabaseClient,
  applicationId: string,
): Promise<InterviewSchedule[]> {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('application_id', applicationId)
    .order('scheduled_at', { ascending: true });

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return (data ?? []) as InterviewSchedule[];
}

export async function updateInterviewStatus(
  client: SupabaseClient,
  id: string,
  status: 'scheduled' | 'completed' | 'cancelled',
): Promise<InterviewSchedule> {
  const { data, error } = await client
    .from(TABLE)
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw RecruitError.notFound('Interview', id);
  return data as InterviewSchedule;
}

export async function getUpcomingInterviews(
  client: SupabaseClient,
  tenantId: string,
  limit: number = 10,
): Promise<InterviewSchedule[]> {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return (data ?? []) as InterviewSchedule[];
}
