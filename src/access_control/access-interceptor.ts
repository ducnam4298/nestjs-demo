import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from '@/logger';

@Injectable()
export class AccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map(data => {
        if (request.method === 'POST' && response.statusCode === 201) {
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
        LoggerService.error(
          `❌ Error in AccessInterceptor: ${error.message}`,
          error instanceof Error ? error.stack : ''
        );
        if (error instanceof HttpException) {
          return throwError(() => error);
        }
        return throwError(() => new InternalServerErrorException('Internal Server'));
      })
    );
  }
}
