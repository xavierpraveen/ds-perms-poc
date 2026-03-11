import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiKey } from '@prisma/client';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggerInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const apiKey: ApiKey = request.apiKey;
    const requestPayload = request.body && Object.keys(request.body).length > 0
      ? request.body
      : undefined;

    const logEntry = {
      apiKeyId: apiKey?.id,
      method: request.method,
      endpoint: request.url,
      ipAddress: request.ip || request.headers['x-forwarded-for'] as string,
      requestPayload,
    };

    return next.handle().pipe(
      tap((responseBody) => {
        if (!apiKey?.id) return;
        const latencyMs = Date.now() - startTime;
        // Fire-and-forget — does not block response
        this.prisma.requestLog
          .create({
            data: {
              ...logEntry,
              statusCode: context.switchToHttp().getResponse().statusCode || 200,
              latencyMs,
              responseBody: responseBody as Record<string, unknown>,
            },
          })
          .catch((err) => this.logger.error(`Failed to write request log: ${err}`));
      }),
      catchError((err) => {
        if (apiKey?.id) {
          const latencyMs = Date.now() - startTime;
          const statusCode = err.status || err.statusCode || 500;
          this.prisma.requestLog
            .create({
              data: {
                ...logEntry,
                statusCode,
                latencyMs,
                responseBody: { message: err.message, error: err.response?.error },
              },
            })
            .catch((e) => this.logger.error(`Failed to write error log: ${e}`));
        }
        return throwError(() => err);
      }),
    );
  }
}
