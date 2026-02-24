// ---------------------------------------------------------------------------
// meet-scheduler.ts -- Cron jobs for follow-up reminders and digests
// ---------------------------------------------------------------------------

import { Cron } from 'croner';
import type { PluginConfig } from '../types/config.js';
import type { ProviderRegistry } from '../types/provider.js';
import { getPendingFollowUps, updateFollowUp } from '../db/follow-ups.js';
import { getOverdueActionItems } from '../db/action-items.js';
import { isoNow } from '../utils/date.js';
import { log } from '../utils/logger.js';

let digestJob: Cron | null = null;

interface SchedulerDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

async function runDigest(deps: SchedulerDeps): Promise<void> {
  log.info('Starting scheduled digest...');

  try {
    const pendingFollowUps = await getPendingFollowUps();
    const overdueActions = await getOverdueActionItems();

    if (pendingFollowUps.length === 0 && overdueActions.length === 0) {
      log.info('No pending follow-ups or overdue actions');
      return;
    }

    const lines: string[] = ['Meeting Digest', ''];

    if (overdueActions.length > 0) {
      lines.push(`Overdue Action Items: ${overdueActions.length}`);
      for (const a of overdueActions.slice(0, 10)) {
        lines.push(`- ${a.title} (${a.assignee}) -- due: ${a.due_date}`);
      }
      lines.push('');
    }

    if (pendingFollowUps.length > 0) {
      lines.push(`Pending Follow-Ups: ${pendingFollowUps.length}`);
      for (const f of pendingFollowUps.slice(0, 10)) {
        lines.push(`- To: ${f.recipient} -- ${f.message.slice(0, 50)}`);
      }
    }

    const message = lines.join('\n');

    // Send via notification provider if configured
    if (deps.providerRegistry.notification) {
      await deps.providerRegistry.notification.sendMessage('general', message).catch((err) => {
        log.error('Failed to send digest notification:', err);
      });
    }

    // Mark follow-ups as sent
    for (const f of pendingFollowUps) {
      await updateFollowUp(f.id, { status: 'sent', sent_at: isoNow() }).catch((err) => {
        log.error(`Failed to mark follow-up #${f.id} as sent:`, err);
      });
    }

    log.info('Digest complete');
  } catch (err) {
    log.error('Digest failed:', err);
  }
}

export function startScheduler(deps: SchedulerDeps): void {
  if (digestJob) {
    log.warn('Scheduler already running');
    return;
  }

  digestJob = new Cron(deps.config.digestSchedule, () => runDigest(deps));
  log.info(`Scheduler started (digest: ${deps.config.digestSchedule})`);
}

export function stopScheduler(): void {
  if (digestJob) {
    digestJob.stop();
    digestJob = null;
    log.info('Scheduler stopped');
  }
}
