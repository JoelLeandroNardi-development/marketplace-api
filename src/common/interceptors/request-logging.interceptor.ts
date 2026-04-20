import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler) {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.log(request, response.statusCode, Date.now() - startedAt);
      }),
      catchError((error: unknown) => {
        const status =
          error instanceof Error && 'status' in error
            ? Number(error.status)
            : 500;
        this.log(request, status, Date.now() - startedAt);
        return throwError(() => error);
      }),
    );
  }

  private log(request: Request, statusCode: number, durationMs: number) {
    this.logger.log(
      `${request.method} ${request.originalUrl} ${statusCode} ${durationMs}ms requestId=${request.requestId ?? 'unknown'}`,
    );
  }
}
