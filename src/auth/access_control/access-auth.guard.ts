import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../../database/database.service';
import { LoggerService } from '../../logger/logger.service';
import { IS_PUBLIC_KEY } from './access.decorator';

@Injectable()
export class AccessAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private databaseService: DatabaseService,
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      LoggerService.warn('🚨 Missing or invalid authorization header', AccessAuthGuard.name);
      throw new ForbiddenException('Access denied: Missing or invalid authorization header');
    }

    try {
      const token = authHeader.split(' ')[1];
      if (!token) {
        LoggerService.warn('🚨 Invalid token format', AccessAuthGuard.name);
        throw new ForbiddenException('Access denied: Invalid token format');
      }

      const decoded = this.jwtService.verify(token);
      const userId = decoded.userId;

      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { role: { include: { permissions: true } } },
      });

      if (!user || !user.role) {
        LoggerService.warn(`🚨 User ${userId} has no assigned role`, AccessAuthGuard.name);
        throw new ForbiddenException('Access denied: User has no assigned role');
      }

      const userRole = user.role.name;
      const userPermissions = user.role.permissions.map(p => p.name);

      const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler()) || [];
      const requiredPermissions =
        this.reflector.get<string[]>('permissions', context.getHandler()) || [];

      if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
        LoggerService.warn(
          `🚨 User ${userId} lacks required roles: ${requiredRoles.join(', ')}`,
          AccessAuthGuard.name
        );
        throw new ForbiddenException(`Access denied: Required roles: ${requiredRoles.join(', ')}`);
      }

      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every(per => userPermissions.includes(per));
        if (!hasPermission) {
          LoggerService.warn(
            `🚨 User ${userId} lacks required permissions: ${requiredPermissions.join(', ')}`,
            AccessAuthGuard.name
          );
          throw new ForbiddenException(
            `Access denied: Required permissions: ${requiredPermissions.join(', ')}`
          );
        }
      }

      LoggerService.log(
        `✅ User ${userId} authorized with role: ${userRole}`,
        AccessAuthGuard.name
      );
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(
        '❌ Access denied due to invalid token or insufficient permissions',
        errorMessage
      );
      throw new ForbiddenException('Access denied: Invalid token or insufficient permissions');
    }
  }
}
