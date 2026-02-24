// ---------------------------------------------------------------------------
// surveys.ts -- CRUD for feedback_surveys table
// ---------------------------------------------------------------------------

import { getSupabase } from './client.js';
import { getConfig } from '../config/index.js';
import { DatabaseError } from '../utils/errors.js';
import type { FeedbackSurvey, FeedbackSurveyInsert } from '../types/index.js';

const TABLE = 'feedback_surveys';

function tenantId(): string {
  return getConfig().tenantId;
}

export async function createSurvey(data: FeedbackSurveyInsert): Promise<FeedbackSurvey> {
  const { data: row, error } = await getSupabase()
    .from(TABLE)
    .insert({ tenant_id: tenantId(), ...data })
    .select()
    .single();
  if (error) throw new DatabaseError(`Failed to create survey: ${error.message}`);
  return row as FeedbackSurvey;
}

export async function getSurveyById(id: number): Promise<FeedbackSurvey | null> {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw new DatabaseError(`Failed to get survey: ${error.message}`);
  return (data as FeedbackSurvey) ?? null;
}

export async function listSurveys(opts: { active?: boolean; limit?: number } = {}): Promise<FeedbackSurvey[]> {
  let query = getSupabase()
    .from(TABLE)
    .select()
    .eq('tenant_id', tenantId())
    .order('created_at', { ascending: false });

  if (opts.active !== undefined) query = query.eq('active', opts.active);
  query = query.limit(opts.limit ?? 50);

  const { data, error } = await query;
  if (error) throw new DatabaseError(`Failed to list surveys: ${error.message}`);
  return (data as FeedbackSurvey[]) ?? [];
}

export async function updateSurveyResponseCount(id: number, increment = 1): Promise<void> {
  const survey = await getSurveyById(id);
  if (!survey) throw new DatabaseError(`Survey ${id} not found`);

  const { error } = await getSupabase()
    .from(TABLE)
    .update({
      response_count: survey.response_count + increment,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId())
    .eq('id', id);
  if (error) throw new DatabaseError(`Failed to update survey response count: ${error.message}`);
}
