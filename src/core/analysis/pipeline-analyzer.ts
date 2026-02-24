import type { Application } from '../types/database.js';
import type { CandidateStage } from '../types/common.js';
import { CANDIDATE_STAGES } from '../types/common.js';
import { daysBetween } from '../utils/date.js';

export interface PipelineMetrics {
  by_stage: Record<string, number>;
  conversion_rates: Record<string, number>;
  avg_time_in_stage: Record<string, number>;
  bottleneck_stage: string | null;
  total_applications: number;
}

export interface DropoffPoint {
  from_stage: CandidateStage;
  to_stage: CandidateStage;
  dropoff_rate: number;
  count: number;
}

// Pipeline stage ordering for conversion rate calculations
const PIPELINE_ORDER: CandidateStage[] = [
  'applied',
  'screening',
  'phone_screen',
  'interview',
  'technical',
  'offer',
  'hired',
];

/**
 * Analyze the hiring pipeline to produce metrics.
 */
export function analyzePipeline(applications: Application[]): PipelineMetrics {
  if (applications.length === 0) {
    return {
      by_stage: {},
      conversion_rates: {},
      avg_time_in_stage: {},
      bottleneck_stage: null,
      total_applications: 0,
    };
  }

  // Count by stage
  const byStage: Record<string, number> = {};
  for (const stage of CANDIDATE_STAGES) {
    byStage[stage] = 0;
  }
  for (const app of applications) {
    byStage[app.stage] = (byStage[app.stage] ?? 0) + 1;
  }

  // Calculate stage progression for conversion rates
  // For each stage, count how many candidates have ever been at that stage or beyond
  const stageReached: Record<string, number> = {};
  for (const stage of PIPELINE_ORDER) {
    const stageIndex = PIPELINE_ORDER.indexOf(stage);
    stageReached[stage] = applications.filter((app) => {
      const appIndex = PIPELINE_ORDER.indexOf(app.stage as CandidateStage);
      // Count if they're at this stage or beyond, or if rejected/withdrawn after this stage
      if (appIndex >= stageIndex) return true;
      if (app.stage === 'rejected' || app.stage === 'withdrawn') {
        // Use the application timeline — approximate by checking score/match_score
        return false;
      }
      return false;
    }).length;
  }

  // Conversion rates between adjacent stages
  const conversionRates: Record<string, number> = {};
  for (let i = 0; i < PIPELINE_ORDER.length - 1; i++) {
    const from = PIPELINE_ORDER[i]!;
    const to = PIPELINE_ORDER[i + 1]!;
    const fromCount = stageReached[from] ?? 0;
    const toCount = stageReached[to] ?? 0;
    conversionRates[`${from}_to_${to}`] =
      fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0;
  }

  // Average time in stage (days)
  const avgTimeInStage: Record<string, number> = {};
  for (const app of applications) {
    if (app.applied_at && app.stage_changed_at) {
      const days = daysBetween(app.applied_at, app.stage_changed_at);
      if (!avgTimeInStage[app.stage]) {
        avgTimeInStage[app.stage] = days;
      } else {
        avgTimeInStage[app.stage] = (avgTimeInStage[app.stage]! + days) / 2;
      }
    }
  }

  // Bottleneck: stage with most current candidates (excluding terminal states)
  const activeStages = PIPELINE_ORDER.filter(
    (s) => s !== 'hired',
  );
  let bottleneckStage: string | null = null;
  let maxCount = 0;
  for (const stage of activeStages) {
    const count = byStage[stage] ?? 0;
    if (count > maxCount) {
      maxCount = count;
      bottleneckStage = stage;
    }
  }

  return {
    by_stage: byStage,
    conversion_rates: conversionRates,
    avg_time_in_stage: avgTimeInStage,
    bottleneck_stage: bottleneckStage,
    total_applications: applications.length,
  };
}

/**
 * Predict approximate time to hire based on pipeline data.
 */
export function predictTimeToHire(applications: Application[]): number {
  const hired = applications.filter((a) => a.stage === 'hired');
  if (hired.length === 0) {
    // Estimate based on average pipeline flow
    return 30; // default 30 days
  }

  const hireTimes = hired.map((a) => daysBetween(a.applied_at, a.stage_changed_at));
  return Math.round(hireTimes.reduce((sum, t) => sum + t, 0) / hireTimes.length);
}

/**
 * Identify stages where candidates drop off most.
 */
export function identifyDropoffPoints(applications: Application[]): DropoffPoint[] {
  const dropoffs: DropoffPoint[] = [];

  for (let i = 0; i < PIPELINE_ORDER.length - 1; i++) {
    const from = PIPELINE_ORDER[i]!;
    const to = PIPELINE_ORDER[i + 1]!;

    const fromIndex = PIPELINE_ORDER.indexOf(from);
    const toIndex = PIPELINE_ORDER.indexOf(to);

    const atOrPastFrom = applications.filter((a) => {
      const idx = PIPELINE_ORDER.indexOf(a.stage as CandidateStage);
      return idx >= fromIndex || a.stage === 'rejected' || a.stage === 'withdrawn';
    }).length;

    const atOrPastTo = applications.filter((a) => {
      const idx = PIPELINE_ORDER.indexOf(a.stage as CandidateStage);
      return idx >= toIndex;
    }).length;

    const dropped = atOrPastFrom - atOrPastTo;
    const rate = atOrPastFrom > 0 ? dropped / atOrPastFrom : 0;

    if (rate > 0) {
      dropoffs.push({
        from_stage: from,
        to_stage: to,
        dropoff_rate: Math.round(rate * 100) / 100,
        count: dropped,
      });
    }
  }

  return dropoffs.sort((a, b) => b.dropoff_rate - a.dropoff_rate);
}
