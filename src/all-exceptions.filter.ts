import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
  PrismaClientValidationError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/library';
import { LoggerService } from '@/services';

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

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    const stackTrace =
      process.env.VERCEL_ENV !== 'production' && exception instanceof Error
        ? exception.stack
        : undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errRes = exception.getResponse() as HttpErrorResponse;
      message = Array.isArray(errRes?.message)
        ? errRes.message.join(', ')
        : (errRes?.message ?? message);
    } else if (exception instanceof PrismaClientKnownRequestError) {
      LoggerService.error(`❌ Prisma Error on ${request.method} ${request.url}`, stackTrace);
      ({ status, message } = handlePrismaError(exception));
    } else if (exception instanceof PrismaClientInitializationError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database initialization failed';
    } else if (exception instanceof PrismaClientRustPanicError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Database crashed due to a Rust panic';
    } else if (exception instanceof PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid database request';
    } else if (exception instanceof PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Unknown database error';
    }

    LoggerService.error(
      `❌ Error processing ${request.method} ${request.url}: ${message}`,
      stackTrace
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      success: false,
      message: process.env.VERCEL_ENV === 'production' ? 'An error occurred.' : message,
    });
  }
}

export const handlePrismaError = (exception: PrismaClientKnownRequestError) => {
  const errorMap: Record<string, { status: number; message: string }> = {
    P2002: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Duplicate entry: This value already exists in the database.',
    },
    P2025: {
      status: HttpStatus.NOT_FOUND,
      message: 'Record not found: Unable to find the requested resource.',
    },
    P2003: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Foreign key constraint failed: Invalid relationship.',
    },
    P2014: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Invalid relation: The change would violate a relation constraint.',
    },
    P2016: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Invalid query: Please check your query syntax.',
    },
    P2011: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Null constraint failed: A required field is missing.',
    },
    P2012: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Missing required value for a non-nullable field.',
    },
    P2013: {
      status: HttpStatus.BAD_REQUEST,
      message: 'Incorrect number of arguments for the query.',
    },
  };

  return (
    errorMap[exception.code] ?? {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: `Database error (${exception.code}): ${exception.message}`,
    }
  );
};
