// ---------------------------------------------------------------------------
// errors.ts -- Custom error classes
// ---------------------------------------------------------------------------

export class HypeError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string = 'HYPE_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'HypeError';
    this.code = code;
    this.statusCode = statusCode;
  }

  static notFound(resource: string): HypeError {
    return new HypeError(`${resource} not found`, 'NOT_FOUND', 404);
  }

  static validation(message: string): HypeError {
    return new HypeError(message, 'VALIDATION_ERROR', 400);
  }

  static configuration(message: string): HypeError {
    return new HypeError(message, 'CONFIG_ERROR', 500);
  }

  static platform(platform: string, message: string): HypeError {
    return new HypeError(`[${platform}] ${message}`, 'PLATFORM_ERROR', 502);
  }

  static rateLimit(platform: string): HypeError {
    return new HypeError(`Rate limit exceeded for ${platform}`, 'RATE_LIMIT', 429);
  }
}

export class DatabaseError extends Error {
  readonly code = 'DATABASE_ERROR';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}

export class ConfigError extends Error {
  readonly code = 'CONFIG_ERROR';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ConfigError';
  }
}

export class AnalysisError extends Error {
  readonly code = 'ANALYSIS_ERROR';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AnalysisError';
  }
}
