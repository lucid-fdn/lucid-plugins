export class ProposeError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'PROPOSE_ERROR',
    statusCode: number = 500,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ProposeError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    Object.setPrototypeOf(this, ProposeError.prototype);
  }

  static notFound(resource: string, id?: string): ProposeError {
    const msg = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    return new ProposeError(msg, 'NOT_FOUND', 404);
  }

  static badRequest(message: string): ProposeError {
    return new ProposeError(message, 'BAD_REQUEST', 400);
  }

  static unauthorized(message: string = 'Unauthorized'): ProposeError {
    return new ProposeError(message, 'UNAUTHORIZED', 401);
  }

  static conflict(message: string): ProposeError {
    return new ProposeError(message, 'CONFLICT', 409);
  }

  static internal(message: string, context?: Record<string, unknown>): ProposeError {
    return new ProposeError(message, 'INTERNAL_ERROR', 500, context);
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

export function isNotFoundError(error: unknown): boolean {
  return error instanceof ProposeError && error.code === 'NOT_FOUND';
}

export function wrapError(error: unknown, fallbackMessage: string): ProposeError {
  if (error instanceof ProposeError) return error;
  const message = error instanceof Error ? error.message : fallbackMessage;
  return ProposeError.internal(message);
}
