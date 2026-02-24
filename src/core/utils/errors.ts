export class RecruitError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'RECRUIT_ERROR',
    statusCode: number = 500,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'RecruitError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
  }

  static notFound(entity: string, id: string): RecruitError {
    return new RecruitError(`${entity} not found: ${id}`, 'NOT_FOUND', 404, { entity, id });
  }

  static validation(message: string, field?: string): RecruitError {
    return new RecruitError(message, 'VALIDATION_ERROR', 400, { field });
  }

  static conflict(message: string): RecruitError {
    return new RecruitError(message, 'CONFLICT', 409);
  }

  static provider(provider: string, message: string): RecruitError {
    return new RecruitError(`[${provider}] ${message}`, 'PROVIDER_ERROR', 502, { provider });
  }
}
