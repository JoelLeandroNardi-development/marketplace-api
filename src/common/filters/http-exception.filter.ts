import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  error?: string;
  message?: string | string[];
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : undefined;
    const body = this.normalizeResponse(exceptionResponse, status);

    if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `${request.method} ${request.originalUrl} failed`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error: body.error,
      message: body.message,
      path: request.originalUrl,
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeResponse(
    response: unknown,
    status: number,
  ): ErrorResponseBody {
    if (typeof response === 'string') {
      return {
        error: HttpStatus[status],
        message: response,
      };
    }

    if (response && typeof response === 'object') {
      const body = response as ErrorResponseBody;

      return {
        error: body.error ?? HttpStatus[status],
        message: body.message ?? HttpStatus[status],
      };
    }

    return {
      error: HttpStatus[status],
      message: 'Unexpected error',
    };
  }
}
