// ---------------------------------------------------------------------------
// utils/logger.ts -- Simple structured logger (writes to stderr)
// ---------------------------------------------------------------------------

const PREFIX = '[trade]';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = (process.env.TRADE_LOG_LEVEL as LogLevel) ?? 'info';

function shouldLog(level: LogLevel): boolean {
  return (LOG_LEVELS[level] ?? 1) >= (LOG_LEVELS[currentLevel] ?? 1);
}

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${PREFIX} [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const log = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('debug')) {
      process.stderr.write(formatMessage('debug', message, meta) + '\n');
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('info')) {
      process.stderr.write(formatMessage('info', message, meta) + '\n');
    }
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    if (shouldLog('warn')) {
      process.stderr.write(formatMessage('warn', message, meta) + '\n');
    }
  },

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    if (shouldLog('error')) {
      const errMeta =
        error instanceof Error
          ? { ...meta, errorMessage: error.message, stack: error.stack }
          : { ...meta, error };
      process.stderr.write(formatMessage('error', message, errMeta) + '\n');
    }
  },

  setLevel(level: LogLevel): void {
    currentLevel = level;
  },

  getLevel(): LogLevel {
    return currentLevel;
  },
};
