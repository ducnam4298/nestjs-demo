import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '@/services';

@Injectable()
export class CleanStringMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    LoggerService.log(
      `🔥 Middleware triggered for ${req.method} ${req.url}`,
      CleanStringMiddleware.name
    );

    if (req.is('multipart/form-data') || req.is('application/x-www-form-urlencoded')) {
      LoggerService.log(
        '⏩ Skipping middleware for file upload or form-data request',
        CleanStringMiddleware.name
      );
      return next();
    }

    if (!req.query || Object.keys(req.query).length === 0) {
      LoggerService.warn(
        '🚨 No query parameters found, skipping cleaning.',
        CleanStringMiddleware.name
      );
      return next();
    }

    const cleanValue = (value: unknown): string | undefined => {
      if (typeof value === 'string') {
        LoggerService.log(`🧼 Cleaning value: ${value}`, CleanStringMiddleware.name);
        return value.trim().replace(/^['"]+|['"]+$/g, '') || undefined;
      }
      return undefined;
    };

    LoggerService.log(
      `🔍 Processing query params: ${JSON.stringify(req.query)}`,
      CleanStringMiddleware.name
    );

    const modifiedQuery = { ...req.query };

    LoggerService.log(
      `🔍 Before modifying - req.query: ${JSON.stringify(req.query)}`,
      CleanStringMiddleware.name
    );

    Object.keys(modifiedQuery).forEach(key => {
      const value = modifiedQuery[key];

      if (typeof value === 'string') {
        const cleaned = cleanValue(value);
        if (cleaned !== undefined) {
          LoggerService.log(
            `✅ Cleaned query param ${key}: ${value} → ${cleaned}`,
            CleanStringMiddleware.name
          );
          modifiedQuery[key] = cleaned;
        } else {
          delete modifiedQuery[key];
        }
      } else if (Array.isArray(value)) {
        LoggerService.log(`🔄 Cleaning array query param ${key}`, CleanStringMiddleware.name);
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
      `🔍 After modifying - req.query: ${JSON.stringify(req.query)}`,
      CleanStringMiddleware.name
    );

    LoggerService.log('✅ Finished processing query params', CleanStringMiddleware.name);
    next();
  }
}
