import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class AccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        const response = context.switchToHttp().getResponse();
        return {
          statusCode: response.statusCode,
          timestamp: new Date().toISOString(),
          success: true,
          message: response.statusMessage || 'Request successful',
          data,
        };
      }),
      catchError(error => {
        if (error instanceof HttpException) {
          return throwError(() => error);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          return throwError(
            () => new BadRequestException(`Database constraint error: ${error.message}`)
          );
        }

        if (error instanceof Prisma.PrismaClientValidationError) {
          return throwError(() => new BadRequestException(`Invalid input data: ${error.message}`));
        }
        return throwError(() => new InternalServerErrorException('Internal Server'));
      })
    );
  }
}
