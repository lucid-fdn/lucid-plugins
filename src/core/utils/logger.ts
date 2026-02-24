const PREFIX = '[propose]';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let currentLevel: LogLevel = 'info';

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}

export const logger = {
  setLevel(level: LogLevel): void {
    currentLevel = level;
  },

  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.debug(`${PREFIX} [DEBUG]`, message, ...args);
    }
  },

  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(`${PREFIX} [INFO]`, message, ...args);
    }
  },

  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(`${PREFIX} [WARN]`, message, ...args);
    }
  },

  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(`${PREFIX} [ERROR]`, message, ...args);
    }
  },
};
