import type { Fetcher, FetchResult, SourceType } from '../types/index.js';
import type { Source } from '../types/index.js';
import { getRateLimiter } from './rate-limiter.js';
import { withRetry } from '../utils/retry.js';
import { log } from '../utils/logger.js';
import { FetchError } from '../utils/errors.js';

export abstract class BaseFetcher implements Fetcher {
  abstract readonly sourceType: SourceType;
  abstract readonly name: string;

  abstract isConfigured(): boolean;

  protected abstract doFetch(source: Source): Promise<FetchResult>;

  async fetch(source: Source): Promise<FetchResult> {
    const limiter = getRateLimiter(this.sourceType);

    return limiter.schedule(async () => {
      log.info(`Fetching from ${this.name}: ${source.url}`);

      try {
        return await withRetry(() => this.doFetch(source), {
          maxAttempts: 2,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.error(`Fetch failed for ${source.url}: ${msg}`);
        throw new FetchError(`${this.name} fetch failed: ${msg}`);
      }
    });
  }
}
