import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '@/services';

@Injectable()
export class AccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const { method, url, headers, ip } = request;
    const response: Response = context.switchToHttp().getResponse();
    LoggerService.log(
      `[REQUEST] ${method} ${url} - IP: ${ip} - User-Agent: ${headers['user-agent']}`
    );
    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const timeTaken = Date.now() - now;
        LoggerService.log(`[RESPONSE] ${method} ${url} - ${response.statusCode} - ${timeTaken}ms`);
      }),
      map(data => {
        if (method === 'POST' && response.statusCode === 201) {
          response.status(200);
        }
        return {
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          success: true,
          message: response.statusMessage || 'Request successful',
          data,
        };
      }),
      catchError(error => {
        const statusCode = error instanceof HttpException ? error.getStatus() : 500;
        LoggerService.error(
          `❌ Error ${statusCode} in AccessInterceptor: ${error.message}`,
          error instanceof Error ? error.stack : ''
        );

        return throwError(() =>
          error instanceof HttpException ? error : new InternalServerErrorException()
        );
      })
    );
  }
}
