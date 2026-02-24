// ---------------------------------------------------------------------------
// seo-scheduler.ts -- Cron jobs for weekly crawl and ranking check
// ---------------------------------------------------------------------------

import { Cron } from 'croner';
import type { PluginConfig } from '../types/config.js';
import type { SeoProviderRegistry } from '../types/provider.js';
import { listKeywords } from '../db/keywords.js';
import { log } from '../utils/logger.js';

let crawlJob: Cron | null = null;

interface SchedulerDeps {
  config: PluginConfig;
  providerRegistry: SeoProviderRegistry;
}

async function runWeeklyCrawl(deps: SchedulerDeps): Promise<void> {
  log.info('Starting scheduled SEO crawl...');

  try {
    const keywords = await listKeywords({ limit: 100 });
    log.info(`Checking rankings for ${keywords.length} tracked keywords`);

    const serpProvider = deps.providerRegistry.getSerpProvider();
    if (!serpProvider) {
      log.warn('No SERP provider configured, skipping ranking check');
      return;
    }

    for (const kw of keywords) {
      try {
        const results = await serpProvider.getSerpResults!(kw.keyword);
        log.debug(`Checked "${kw.keyword}": ${results.length} results`);
      } catch (err) {
        log.error(`Failed to check keyword "${kw.keyword}":`, err);
      }
    }

    log.info('Weekly SEO crawl complete');
  } catch (err) {
    log.error('Weekly SEO crawl failed:', err);
  }
}

export function startScheduler(deps: SchedulerDeps): void {
  if (crawlJob) {
    log.warn('Scheduler already running');
    return;
  }

  crawlJob = new Cron(deps.config.crawlSchedule, () => runWeeklyCrawl(deps));
  log.info(`Scheduler started (crawl: ${deps.config.crawlSchedule})`);
}

export function stopScheduler(): void {
  if (crawlJob) {
    crawlJob.stop();
    crawlJob = null;
    log.info('Scheduler stopped');
  }
}
