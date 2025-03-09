import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from '@/auth/token.service';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/services';
import { NameStatusUser } from '@/shared/constants';
import { DecoratorKeys } from '@/shared/enums';

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private databaseService: DatabaseService,
    private tokenService: TokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(DecoratorKeys.PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      LoggerService.log('✅ Request is public, skipping authentication.', AccessGuard.name);
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const authHeader: string = request.headers['authorization'];
    if (!authHeader || !/^Bearer\s[\w-]+\.[\w-]+\.[\w-]+$/.test(authHeader)) {
      LoggerService.warn('🚨 Invalid authorization header format', AccessGuard.name);
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const deviceId: string = (request.headers['device-id'] as string)?.trim();
    if (!deviceId) {
      LoggerService.warn('🚨 Missing device ID', AccessGuard.name);
      throw new UnauthorizedException('Missing device ID');
    }

    const token = authHeader.split(' ')[1];
    const payload = this.tokenService.verifyToken(token);

    const user = await this.databaseService.user.findUnique({
      where: { id: payload.userId },
      include: { role: { include: { permissions: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.role) {
      LoggerService.warn(`🚨 User ${user.id} has no assigned role`, AccessGuard.name);
      throw new ForbiddenException('User has no assigned role');
    }

    if (!user.isActive) {
      const statusMessage = NameStatusUser(user.status) ?? 'inactivated';
      LoggerService.warn(`🚨 User account is ${statusMessage}`, AccessGuard.name);
      throw new ForbiddenException(`User account is ${statusMessage}`);
    }

    const userRole = user.role.name;
    const userPermissions = user.role.permissions.map(p => p.name);

    const requiredRoles =
      this.reflector.get<string[]>(DecoratorKeys.ROLES, context.getHandler()) || [];
    const requiredPermissions =
      this.reflector.get<string[]>(DecoratorKeys.PERMISSIONS, context.getHandler()) || [];

    if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
      LoggerService.warn(
        `🚨 User ${user.id} lacks required roles: ${requiredRoles.join(', ')}`,
        AccessGuard.name
      );
      throw new ForbiddenException(`Required roles: ${requiredRoles.join(', ')}`);
    }

    if (
      requiredPermissions.length > 0 &&
      !requiredPermissions.every(per => userPermissions.includes(per))
    ) {
      LoggerService.warn(
        `🚨 User ${user.id} lacks required permissions: ${requiredPermissions.join(', ')}`,
        AccessGuard.name
      );
      throw new ForbiddenException(`Required permissions: ${requiredPermissions.join(', ')}`);
    }

    request.user = user;
    LoggerService.log(`✅ User ${user.id} authorized with role: ${userRole}`, AccessGuard.name);
    return true;
  }
}
