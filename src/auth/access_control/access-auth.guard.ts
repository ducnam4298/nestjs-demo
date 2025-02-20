/* eslint-disable @typescript-eslint/no-unsafe-call */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AccessAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private databaseService: DatabaseService,
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    if (!authHeader) throw new ForbiddenException('Access denied');

    try {
      const token = authHeader.split(' ')[1];
      const decoded = this.jwtService.verify(token);
      // const decoded = this.jwtService.verify(token, { secret: JWT_SECRET });
      const userId = decoded.id;

      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { role: { include: { permissions: true } } },
      });

      if (!user || !user.role) throw new ForbiddenException('User has no assigned role');

      const userPermissions = user.role.permissions.map(p => p.name);

      const hasPermission = requiredPermissions.every(per => userPermissions.includes(per));

      if (!hasPermission) throw new ForbiddenException('Insufficient permissions');

      return true;
    } catch (error) {
      throw new ForbiddenException('Invalid token or permissions');
    }
  }
}
