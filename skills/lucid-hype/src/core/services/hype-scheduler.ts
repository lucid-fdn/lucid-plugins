// ---------------------------------------------------------------------------
// hype-scheduler.ts -- Scheduled tasks for content posting and metrics
// ---------------------------------------------------------------------------

import type { PluginConfig } from '../types/index.js';
import { log } from '../utils/logger.js';

let schedulerInterval: ReturnType<typeof setInterval> | null = null;

interface SchedulerDeps {
  config: PluginConfig;
}

async function runScheduledTasks(_deps: SchedulerDeps): Promise<void> {
  log.debug('Running scheduled hype tasks...');
  // In production: check for scheduled posts, collect metrics, etc.
}

export function startScheduler(deps: SchedulerDeps): void {
  if (schedulerInterval) {
    log.warn('Hype scheduler already running');
    return;
  }

  // Run every 5 minutes
  schedulerInterval = setInterval(() => runScheduledTasks(deps), 5 * 60 * 1000);
  log.info(`Hype scheduler started (post schedule: ${deps.config.postSchedule})`);
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    log.info('Hype scheduler stopped');
  }
}
