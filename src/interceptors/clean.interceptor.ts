import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';
import { LoggerService } from '@/services';

@Injectable()
export class CleanQueryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();

    LoggerService.log(
      `🔥 Interceptor triggered for ${req.method} ${req.url}`,
      CleanQueryInterceptor.name
    );

    if (req.is('multipart/form-data') || req.is('application/x-www-form-urlencoded')) {
      LoggerService.log(
        '⏩ Skipping middleware for file upload or form-data request',
        CleanQueryInterceptor.name
      );
      return next.handle();
    }

    if (!req.query || Object.keys(req.query).length === 0) {
      LoggerService.warn(
        '🚨 No query parameters found, skipping cleaning.',
        CleanQueryInterceptor.name
      );
      return next.handle();
    }

    const cleanValue = (value: unknown): string | undefined => {
      if (typeof value === 'string') {
        LoggerService.log(`🧼 Cleaning value: "${value}"`, CleanQueryInterceptor.name);
        return value.trim().replace(/^['"]+|['"]+$/g, '') || undefined;
      }
      return undefined;
    };

    LoggerService.log(
      `🔍 Processing query params: ${JSON.stringify(req.query)}`,
      CleanQueryInterceptor.name
    );

    const modifiedQuery = { ...req.query };

    LoggerService.log(
      `🔍 Before cleaning - req.query: ${JSON.stringify(req.query)}`,
      CleanQueryInterceptor.name
    );

    Object.keys(modifiedQuery).forEach(key => {
      const value = modifiedQuery[key];

      if (typeof value === 'string') {
        const cleaned = cleanValue(value);
        if (cleaned !== undefined) {
          LoggerService.log(
            `✅ Cleaned query param ${key}: ${value} → ${cleaned}`,
            CleanQueryInterceptor.name
          );
          modifiedQuery[key] = cleaned;
        } else {
          delete modifiedQuery[key];
        }
      } else if (Array.isArray(value)) {
        LoggerService.log(`🔄 Cleaning array query param ${key}`, CleanQueryInterceptor.name);
        modifiedQuery[key] = value
          .map(v => (typeof v === 'string' ? (cleanValue(v) ?? v) : v))
          .filter(v => v !== undefined);
      }
    });

    Object.defineProperty(req, 'query', {
      value: modifiedQuery,
      writable: true,
      configurable: true,
    });

    LoggerService.log(
      `🔍 After cleaning - req.query: ${JSON.stringify(req.query)}`,
      CleanQueryInterceptor.name
    );

    LoggerService.log('✅ Finished processing query params', CleanQueryInterceptor.name);
    return next.handle();
  }
}
