import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '@/services';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    LoggerService.log(
      `ℹ️ [REQUEST] ${req.method} ${req.url} - Body: ${JSON.stringify(req.body)}`,
      LoggerMiddleware.name
    );

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      LoggerService.log(
        `✅ [RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`,
        LoggerMiddleware.name
      );
    });

    next();
  }
}
