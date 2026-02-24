// ---------------------------------------------------------------------------
// logger.ts -- Structured logging, prefixed with [meet]
// ---------------------------------------------------------------------------

const PREFIX = '[meet]';

export const log = {
  info(...args: unknown[]): void {
    console.log(PREFIX, ...args);
  },
  warn(...args: unknown[]): void {
    console.warn(PREFIX, ...args);
  },
  error(...args: unknown[]): void {
    console.error(PREFIX, ...args);
  },
  debug(...args: unknown[]): void {
    if (process.env.DEBUG) {
      console.log(PREFIX, '[debug]', ...args);
    }
  },
} as const;
