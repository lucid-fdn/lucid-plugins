import type { SupabaseClient } from '@supabase/supabase-js';
import type { PluginConfig } from '../types/config.js';
import { listApplications } from '../db/applications.js';
import { getCandidate } from '../db/candidates.js';
import { getJob } from '../db/jobs.js';
import { updateApplicationScore, updateApplicationStage } from '../db/applications.js';
import { scoreCandidate } from '../analysis/candidate-scorer.js';
import { analyzePipeline } from '../analysis/pipeline-analyzer.js';
import { logger } from '../utils/logger.js';

export interface SchedulerResult {
  screened: number;
  errors: number;
}

/**
 * Auto-screen new applications that are in the 'applied' stage.
 */
export async function autoScreenNewApplications(
  client: SupabaseClient,
  config: PluginConfig,
): Promise<SchedulerResult> {
  if (!config.autoScreenEnabled) {
    logger.info('Auto-screen is disabled');
    return { screened: 0, errors: 0 };
  }

  logger.info('Running auto-screen for new applications...');

  const applications = await listApplications(client, config.tenantId, {
    stage: 'applied',
  });

  let screened = 0;
  let errors = 0;

  for (const app of applications) {
    try {
      const candidate = await getCandidate(client, app.candidate_id);
      const job = await getJob(client, app.job_id);
      const result = scoreCandidate(candidate, job);

      await updateApplicationScore(client, app.id, result.total, result.breakdown.skills_match);
      await updateApplicationStage(client, app.id, 'screening');

      screened++;
      logger.info(
        `Screened application ${app.id}: score=${result.total}`,
      );
    } catch (err) {
      errors++;
      logger.error(`Failed to screen application ${app.id}:`, err);
    }
  }

  logger.info(`Auto-screen complete: ${screened} screened, ${errors} errors`);
  return { screened, errors };
}

/**
 * Generate a daily pipeline summary.
 */
export async function generateDailySummary(
  client: SupabaseClient,
  config: PluginConfig,
): Promise<string> {
  const applications = await listApplications(client, config.tenantId);
  const metrics = analyzePipeline(applications);

  const lines: string[] = [
    '=== Daily Pipeline Summary ===',
    `Total Applications: ${metrics.total_applications}`,
    '',
    'Stage Breakdown:',
  ];

  for (const [stage, count] of Object.entries(metrics.by_stage)) {
    if (count > 0) {
      lines.push(`  ${stage}: ${count}`);
    }
  }

  lines.push('');
  lines.push('Conversion Rates:');
  for (const [key, rate] of Object.entries(metrics.conversion_rates)) {
    lines.push(`  ${key}: ${rate}%`);
  }

  if (metrics.bottleneck_stage) {
    lines.push('');
    lines.push(`Bottleneck Stage: ${metrics.bottleneck_stage}`);
  }

  const summary = lines.join('\n');
  logger.info(summary);
  return summary;
}
