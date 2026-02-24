export class BridgeError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'BRIDGE_ERROR',
    statusCode: number = 500,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'BridgeError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    Object.setPrototypeOf(this, BridgeError.prototype);
  }

  static notFound(resource: string, id?: string): BridgeError {
    return new BridgeError(
      `${resource}${id ? ` (${id})` : ''} not found`,
      'NOT_FOUND',
      404,
      { resource, id },
    );
  }

  static badRequest(message: string): BridgeError {
    return new BridgeError(message, 'BAD_REQUEST', 400);
  }

  static unauthorized(message: string = 'Unauthorized'): BridgeError {
    return new BridgeError(message, 'UNAUTHORIZED', 401);
  }

  static platformError(platform: string, message: string, cause?: unknown): BridgeError {
    return new BridgeError(
      `[${platform}] ${message}`,
      'PLATFORM_ERROR',
      502,
      { platform, cause: String(cause) },
    );
  }

  static syncError(message: string, mappingId?: string): BridgeError {
    return new BridgeError(message, 'SYNC_ERROR', 500, { mappingId });
  }

  static configError(message: string): BridgeError {
    return new BridgeError(message, 'CONFIG_ERROR', 500);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

export function isBridgeError(err: unknown): err is BridgeError {
  return err instanceof BridgeError;
}
