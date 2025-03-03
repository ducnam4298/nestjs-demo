import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { LoggerService } from './logger';

type MyResponseObj = {
  statusCode: number;
  timestamp: string;
  path: string;
  success: boolean;
  message: string;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const myResponseObj: MyResponseObj = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      success: false,
      message: 'Unknown error',
    };

    if (exception instanceof UnauthorizedException || exception instanceof ForbiddenException) {
      myResponseObj.statusCode = exception.getStatus();
      myResponseObj.message = exception.message || 'Authentication failed';
    } else if (exception instanceof HttpException) {
      myResponseObj.statusCode = exception.getStatus();
      myResponseObj.message = exception.message;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      myResponseObj.statusCode = 422;
      myResponseObj.message = exception.message.replace(/\n/g, '');
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      myResponseObj.statusCode = 400;
      myResponseObj.message = exception.message;
    }

    response.status(myResponseObj.statusCode).json(myResponseObj);
    LoggerService.error(
      `❌ Exception: ${JSON.stringify(myResponseObj.message)}`,
      AllExceptionsFilter.name
    );
  }
}
