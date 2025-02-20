/* eslint-disable @typescript-eslint/no-unsafe-call */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../../shared/constants';

@Injectable()
export class AccessAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new ForbiddenException('Access denied');

    try {
      const token = authHeader.split(' ')[1];
      const decoded = verify(token, JWT_SECRET) as { permissions: string[] };

      const hasPermission = requiredPermissions.every(perm => decoded.permissions.includes(perm));

      if (!hasPermission) throw new ForbiddenException('Insufficient permissions');

      return true;
    } catch {
      throw new ForbiddenException('Invalid token or permissions');
    }
  }
}
