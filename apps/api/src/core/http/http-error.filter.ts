import { Catch, HttpException, HttpStatus, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

import type { ErrorResponse } from '@repo/schema/shared';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    const body = exception instanceof HttpException ? this.fromHttpException(exception) : this.internal(exception);

    host.switchToHttp().getResponse<Response>().status(body.statusCode).json(body);
  }

  private fromHttpException(exception: HttpException): ErrorResponse {
    const response = exception.getResponse();
    const code = typeof response === 'object' && 'code' in response ? response.code : undefined;

    return {
      statusCode: exception.getStatus(),
      ...(typeof code === 'string' ? { code } : {}),
      message: exception.message,
    };
  }

  // The client sees only a bare 500; the cause stays in the log, where it may name internals.
  private internal(exception: unknown): ErrorResponse {
    this.logger.error(exception instanceof Error ? exception.stack : String(exception));

    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }
}
