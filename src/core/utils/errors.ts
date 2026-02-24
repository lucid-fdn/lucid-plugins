// ---------------------------------------------------------------------------
// errors.ts -- Custom error classes
// ---------------------------------------------------------------------------

export class FeedbackError extends Error {
  readonly code = 'FEEDBACK_ERROR';
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'FeedbackError';
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

export class ChannelError extends Error {
  readonly code = 'CHANNEL_ERROR';
  readonly channel: string;
  constructor(channel: string, message: string, options?: ErrorOptions) {
    super(`[${channel}] ${message}`, options);
    this.name = 'ChannelError';
    this.channel = channel;
  }
}
