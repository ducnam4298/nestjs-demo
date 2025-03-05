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
import { LoggerService } from '@/logger';

@Injectable()
export class AccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map(data => ({
        statusCode: response.statusCode,
        timestamp: new Date().toISOString(),
        success: true,
        message: response.statusMessage || 'Request successful',
        data,
      })),
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
