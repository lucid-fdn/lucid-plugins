import { Cron } from 'croner';
import type { PluginConfig, SourceType, Fetcher } from '../types/index.js';
import { log } from '../utils/logger.js';

export interface SchedulerDeps {
  config: PluginConfig;
  fetcherRegistry: Map<SourceType, Fetcher>;
  onFetch: () => Promise<void>;
  onDailyDigest: () => Promise<void>;
  onWeeklyDigest: () => Promise<void>;
}

let jobs: Cron[] = [];

/**
 * Start the scheduled jobs for fetching sources and generating digests.
 *
 * Three cron jobs are created:
 * 1. Source fetch — runs on `config.fetchCron`
 * 2. Daily digest — runs on `config.dailyDigestCron`
 * 3. Weekly digest — runs on `config.weeklyDigestCron`
 *
 * All jobs use the timezone from `config.timezone`.
 */
export function startScheduler(deps: SchedulerDeps): void {
  const { config } = deps;

  // Stop any existing jobs before starting new ones
  stopScheduler();

  jobs.push(
    new Cron(config.fetchCron, { timezone: config.timezone }, async () => {
      log.info('Scheduled fetch triggered');
      try {
        await deps.onFetch();
      } catch (e) {
        log.error('Scheduled fetch failed', e);
      }
    }),
  );

  jobs.push(
    new Cron(config.dailyDigestCron, { timezone: config.timezone }, async () => {
      log.info('Scheduled daily digest triggered');
      try {
        await deps.onDailyDigest();
      } catch (e) {
        log.error('Scheduled daily digest failed', e);
      }
    }),
  );

  jobs.push(
    new Cron(config.weeklyDigestCron, { timezone: config.timezone }, async () => {
      log.info('Scheduled weekly digest triggered');
      try {
        await deps.onWeeklyDigest();
      } catch (e) {
        log.error('Scheduled weekly digest failed', e);
      }
    }),
  );

  log.info(
    `Scheduler started: fetch=${config.fetchCron}, daily=${config.dailyDigestCron}, weekly=${config.weeklyDigestCron} (${config.timezone})`,
  );
}

/**
 * Stop all scheduled cron jobs and clear the jobs list.
 */
export function stopScheduler(): void {
  for (const job of jobs) {
    job.stop();
  }
  jobs = [];
  log.info('Scheduler stopped');
}
