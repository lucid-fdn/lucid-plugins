export class VeilleError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'VeilleError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigError extends VeilleError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class FetchError extends VeilleError {
  constructor(message: string) {
    super(message, 'FETCH_ERROR');
    this.name = 'FetchError';
  }
}

export class DatabaseError extends VeilleError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class PublishError extends VeilleError {
  constructor(message: string) {
    super(message, 'PUBLISH_ERROR');
    this.name = 'PublishError';
  }
}
