import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './access.decorator';
import { TokenService } from '@/auth/token.service';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/logger';
import { NameStatusUser } from '@/shared/constants';

@Injectable()
export class AccessAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private databaseService: DatabaseService,
    private tokenService: TokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    if (!authHeader || typeof authHeader !== 'string') {
      LoggerService.warn('🚨 Missing or invalid authorization header', AccessAuthGuard.name);
      throw new ForbiddenException('Missing or invalid authorization header');
    }

    const deviceId = request.headers['device-id'];
    if (!deviceId) {
      LoggerService.warn('🚨 Missing device ID', AccessAuthGuard.name);
      throw new UnauthorizedException('Missing device ID');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const payload = this.tokenService.verifyToken(token);

    try {
      const userId = payload.userId;

      const user = await this.databaseService.user.findUnique({
        where: { id: userId },
        include: { role: { include: { permissions: true } } },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.role) {
        LoggerService.warn(`🚨 User ${userId} has no assigned role`, AccessAuthGuard.name);
        throw new ForbiddenException('User has no assigned role');
      }

      if (!user.isActive) {
        const { status } = user;
        LoggerService.warn(`🚨 User account is ${NameStatusUser(status)}`, AccessAuthGuard.name);
        throw new ForbiddenException(`User account is ${NameStatusUser(status)}`);
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
        throw new ForbiddenException(`Required roles: ${requiredRoles.join(', ')}`);
      }

      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.every(per => userPermissions.includes(per));
        if (!hasPermission) {
          LoggerService.warn(
            `🚨 User ${userId} lacks required permissions: ${requiredPermissions.join(', ')}`,
            AccessAuthGuard.name
          );
          throw new ForbiddenException(`Required permissions: ${requiredPermissions.join(', ')}`);
        }
      }

      request.user = user;
      LoggerService.log(
        `✅ User ${userId} authorized with role: ${userRole}`,
        AccessAuthGuard.name
      );
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error(`❌ Access denied: ${errorMessage}`, AccessAuthGuard.name);
      throw error;
    }
  }
}
