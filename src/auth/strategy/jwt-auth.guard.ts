/* eslint-disable @typescript-eslint/no-unsafe-call */

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../../shared/constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) return false;
    try {
      request.user = verify(token, JWT_SECRET);
      return true;
    } catch {
      return false;
    }
  }
}
