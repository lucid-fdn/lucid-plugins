// ---------------------------------------------------------------------------
// feedback-scheduler.ts -- Cron job for scheduled feedback collection
// ---------------------------------------------------------------------------

import { Cron } from 'croner';
import type { PluginConfig } from '../types/config.js';
import { countFeedback } from '../db/feedback-items.js';
import { daysAgo } from '../utils/date.js';
import { log } from '../utils/logger.js';

let collectJob: Cron | null = null;

interface SchedulerDeps {
  config: PluginConfig;
}

async function runCollectionCycle(_deps: SchedulerDeps): Promise<void> {
  log.info('Starting scheduled feedback collection cycle...');

  try {
    const recent = await countFeedback({ since: daysAgo(1) });
    log.info(`Recent feedback items (24h): ${recent}`);

    // Placeholder for channel-specific collection (Intercom, Zendesk, etc.)
    // Each integration would pull new feedback from the external API and insert it

    log.info('Collection cycle complete');
  } catch (err) {
    log.error('Collection cycle failed:', err);
  }
}

export function startScheduler(deps: SchedulerDeps): void {
  if (collectJob) {
    log.warn('Scheduler already running');
    return;
  }

  collectJob = new Cron(deps.config.collectSchedule, () => runCollectionCycle(deps));
  log.info(`Scheduler started (collect: ${deps.config.collectSchedule})`);
}

export function stopScheduler(): void {
  if (collectJob) {
    collectJob.stop();
    collectJob = null;
    log.info('Scheduler stopped');
  }
}
