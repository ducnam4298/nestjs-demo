import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';
import { Request, Response } from 'express';
import { LoggerService } from './logger';

type MyResponseObj = {
  statusCode: number;
  timestamp: string;
  path: string;
  response: string | object;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const myResponseObj: MyResponseObj = {
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: '',
    };
    if (exception instanceof UnauthorizedException || exception instanceof ForbiddenException) {
      myResponseObj.statusCode = exception.getStatus();
      myResponseObj.response = {
        success: false,
        message: exception.message || 'Authentication failed',
      };
    } else if (exception instanceof HttpException) {
      myResponseObj.statusCode = exception.getStatus();
      myResponseObj.response = exception.getResponse();
    } else if (exception instanceof PrismaClientValidationError) {
      myResponseObj.statusCode = 422;
      myResponseObj.response = exception.message.replaceAll(/\n/g, '');
    } else {
      myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      myResponseObj.response = 'INTERNAL SERVER ERROR';
    }
    response.status(myResponseObj.statusCode).json(myResponseObj);
    LoggerService.error(
      `❌ Exception: ${JSON.stringify(myResponseObj.response)}`,
      AllExceptionsFilter.name
    );
    super.catch(exception, host);
  }
}
