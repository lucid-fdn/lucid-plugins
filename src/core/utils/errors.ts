// ---------------------------------------------------------------------------
// errors.ts -- Custom error classes
// ---------------------------------------------------------------------------

export class FetchError extends Error {
  readonly code = 'FETCH_ERROR';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FetchError';
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

export class ProviderError extends Error {
  readonly code = 'PROVIDER_ERROR';
  readonly provider: string;
  constructor(provider: string, message: string, options?: ErrorOptions) {
    super(`[${provider}] ${message}`, options);
    this.name = 'ProviderError';
    this.provider = provider;
  }
}

export class AnalyticsError extends Error {
  readonly code = 'ANALYTICS_ERROR';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AnalyticsError';
  }
}
