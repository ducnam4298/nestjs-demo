import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { LoggerService } from '@/logger';

interface HttpErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Internal server error';

    if (exception instanceof NotFoundException) {
      LoggerService.warn(`🚨 Not Found: ${request.url} -> Redirecting to /api`);
      return response.redirect(302, '/api');
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else {
        const res = errorResponse as HttpErrorResponse;
        if (Array.isArray(res.message)) {
          message = res.message.join(', ');
        } else {
          message = res.message || message;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      LoggerService.error(
        `❌ Error processing ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : ''
      );
      status = HttpStatus.BAD_REQUEST;
      message = 'Database known error occurred';
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database validation error occurred';
    } else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown database error occurred';
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database initialization error occurred';
    } else if (exception instanceof Prisma.PrismaClientRustPanicError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database internal error occurred';
    }

    LoggerService.error(
      `❌ Error processing ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : ''
    );

    const errorResponseObj = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      success: false,
      message: process.env.VERCEL_ENV === 'production' ? 'An error occurred.' : message,
    };

    response.status(status).json(errorResponseObj);
  }
}
