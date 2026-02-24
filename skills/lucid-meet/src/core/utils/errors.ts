// ---------------------------------------------------------------------------
// errors.ts -- Custom error classes
// ---------------------------------------------------------------------------

export class MeetError extends Error {
  readonly code: string;
  constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'MeetError';
    this.code = code;
  }
}

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

export class AnalysisError extends Error {
  readonly code = 'ANALYSIS_ERROR';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AnalysisError';
  }
}
