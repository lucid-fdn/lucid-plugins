import type { SupabaseClient } from '@supabase/supabase-js';
import type { Candidate } from '../types/index.js';
import { RecruitError } from '../utils/errors.js';
import { nowISO } from '../utils/date.js';

const TABLE = 'recruit_candidates';

export async function createCandidate(
  client: SupabaseClient,
  data: Omit<Candidate, 'id' | 'created_at' | 'updated_at'>,
): Promise<Candidate> {
  const now = nowISO();
  const { data: candidate, error } = await client
    .from(TABLE)
    .insert({ ...data, created_at: now, updated_at: now })
    .select()
    .single();

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return candidate as Candidate;
}

export async function getCandidate(client: SupabaseClient, id: string): Promise<Candidate> {
  const { data, error } = await client.from(TABLE).select('*').eq('id', id).single();
  if (error || !data) throw RecruitError.notFound('Candidate', id);
  return data as Candidate;
}

export async function searchCandidates(
  client: SupabaseClient,
  tenantId: string,
  options: {
    query?: string;
    skills?: string[];
    location?: string;
    limit?: number;
  },
): Promise<Candidate[]> {
  let q = client.from(TABLE).select('*').eq('tenant_id', tenantId);

  if (options.query) {
    q = q.or(
      `first_name.ilike.%${options.query}%,last_name.ilike.%${options.query}%,email.ilike.%${options.query}%,current_title.ilike.%${options.query}%`,
    );
  }

  if (options.location) {
    q = q.ilike('location', `%${options.location}%`);
  }

  if (options.skills && options.skills.length > 0) {
    q = q.overlaps('skills', options.skills);
  }

  const { data, error } = await q
    .order('created_at', { ascending: false })
    .limit(options.limit ?? 25);

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return (data ?? []) as Candidate[];
}

export async function updateCandidate(
  client: SupabaseClient,
  id: string,
  updates: Partial<Candidate>,
): Promise<Candidate> {
  const { data, error } = await client
    .from(TABLE)
    .update({ ...updates, updated_at: nowISO() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) throw RecruitError.notFound('Candidate', id);
  return data as Candidate;
}

export async function findCandidateByEmail(
  client: SupabaseClient,
  tenantId: string,
  email: string,
): Promise<Candidate | null> {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('email', email)
    .maybeSingle();

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return (data as Candidate) ?? null;
}
