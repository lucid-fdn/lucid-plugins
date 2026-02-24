import type { SupabaseClient } from '@supabase/supabase-js';
import type { Evaluation } from '../types/index.js';
import { RecruitError } from '../utils/errors.js';
import { nowISO } from '../utils/date.js';

const TABLE = 'recruit_evaluations';

export async function createEvaluation(
  client: SupabaseClient,
  data: Omit<Evaluation, 'id' | 'created_at'>,
): Promise<Evaluation> {
  const { data: evaluation, error } = await client
    .from(TABLE)
    .insert({ ...data, created_at: nowISO() })
    .select()
    .single();

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return evaluation as Evaluation;
}

export async function listEvaluations(
  client: SupabaseClient,
  applicationId: string,
): Promise<Evaluation[]> {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) throw new RecruitError(error.message, 'DB_ERROR', 500);
  return (data ?? []) as Evaluation[];
}

export async function getEvaluationSummary(
  client: SupabaseClient,
  applicationId: string,
): Promise<{ total: number; ratings: Record<string, number>; averageConfidence: number }> {
  const evaluations = await listEvaluations(client, applicationId);
  const ratings: Record<string, number> = {};

  for (const ev of evaluations) {
    ratings[ev.rating] = (ratings[ev.rating] ?? 0) + 1;
  }

  const ratingValues: Record<string, number> = {
    strong_no: 1,
    no: 2,
    neutral: 3,
    yes: 4,
    strong_yes: 5,
  };

  const avg =
    evaluations.length > 0
      ? evaluations.reduce((sum, ev) => sum + (ratingValues[ev.rating] ?? 3), 0) /
        evaluations.length
      : 0;

  return { total: evaluations.length, ratings, averageConfidence: avg };
}
