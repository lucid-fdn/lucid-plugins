// ---------------------------------------------------------------------------
// metrics-scheduler.ts -- Cron jobs for metric snapshots and weekly reports
// ---------------------------------------------------------------------------

import { Cron } from 'croner';
import type { PluginConfig, ProviderRegistry } from '../types/index.js';
import { countEvents, getUniqueUsers } from '../db/events.js';
import { listMetrics } from '../db/metrics.js';
import { isoNow, isoDate } from '../utils/date.js';
import { formatNumber } from '../utils/text.js';
import { log } from '../utils/logger.js';

let reportJob: Cron | null = null;

interface SchedulerDeps {
  config: PluginConfig;
  providerRegistry: ProviderRegistry;
}

async function generateWeeklyReport(deps: SchedulerDeps): Promise<void> {
  log.info('Generating weekly metrics report...');

  try {
    const tenantId = deps.config.tenantId;
    const [totalEvents, uniqueUsers, metrics] = await Promise.all([
      countEvents(tenantId).catch(() => 0),
      getUniqueUsers(tenantId).catch(() => 0),
      listMetrics(tenantId).catch(() => []),
    ]);

    const configuredProviders = deps.providerRegistry.getConfigured();

    const report = [
      `Weekly Metrics Report - ${isoDate(new Date())}`,
      `Generated: ${isoNow()}`,
      '',
      `Total events: ${formatNumber(totalEvents)}`,
      `Unique users: ${formatNumber(uniqueUsers)}`,
      `Metric definitions: ${metrics.length}`,
      `Active providers: ${configuredProviders.map((p) => p.name).join(', ') || 'None'}`,
    ].join('\n');

    log.info(report);

    // Send to Slack if configured
    if (deps.config.slackWebhookUrl) {
      try {
        await fetch(deps.config.slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: report }),
        });
        log.info('Weekly report sent to Slack');
      } catch (err) {
        log.error('Failed to send Slack report:', err);
      }
    }
  } catch (err) {
    log.error('Weekly report generation failed:', err);
  }
}

export function startScheduler(deps: SchedulerDeps): void {
  if (reportJob) {
    log.warn('Scheduler already running');
    return;
  }

  reportJob = new Cron(deps.config.reportSchedule, () => generateWeeklyReport(deps));
  log.info(`Scheduler started (report: ${deps.config.reportSchedule})`);
}

export function stopScheduler(): void {
  if (reportJob) {
    reportJob.stop();
    reportJob = null;
    log.info('Scheduler stopped');
  }
}
