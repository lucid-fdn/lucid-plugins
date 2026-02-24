import { log } from './logger.js';

export interface RetryOptions {
  /** Maximum number of attempts. Default: 3 */
  maxAttempts?: number;
  /** Base delay in milliseconds between retries. Default: 1000 */
  delayMs?: number;
  /** Use exponential backoff. Default: true */
  backoff?: boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const delayMs = options?.delayMs ?? 1000;
  const backoff = options?.backoff ?? true;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === maxAttempts;

      if (isLastAttempt) {
        break;
      }

      const delay = backoff ? delayMs * Math.pow(2, attempt - 1) : delayMs;
      log.warn(
        `Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`,
        error instanceof Error ? error.message : String(error),
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
