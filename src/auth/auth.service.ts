/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../shared/constants';
import { DatabaseService } from '../database/database.service';
import { RolesService } from '../roles';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private readonly rolesService: RolesService
  ) {}
  async register(registerDto: RegisterDto) {
    const { name, password, username, email, phone, roleId } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const identifier = username || email || phone;
    if (!identifier) throw new BadRequestException('Username, email, or phone is required');

    let role = roleId
      ? await this.databaseService.role.findUnique({ where: { id: roleId } })
      : await this.databaseService.role.findUnique({ where: { name: 'USER' } });

    if (!role) {
      role = await this.rolesService.create({ name: 'USER' });
    }

    if (roleId) {
      const existingRole = await this.databaseService.role.findUnique({ where: { id: roleId } });
      if (!existingRole) throw new BadRequestException('Invalid roleId');
    }

    return this.databaseService.user.create({
      data: {
        name,
        roleId: roleId || role.id,
        email,
        phone,
        login: {
          create: { username, email, phone, password: hashedPassword },
        },
      },
    });
  }

  async registerSuperAdmin() {
    const hashedPassword = await bcrypt.hash('superadmin', 10);
    const roleName = 'SUPER_ADMIN';
    const email = 'admin@gmail.com';

    let role = await this.databaseService.role.findUnique({
      where: { name: roleName },
      include: { permissions: true },
    });

    if (!role) {
      role = await this.rolesService.create({ name: roleName });

      await this.rolesService.updateRolePermissions(role.id);
    } else {
      const hasAllPermissions = await this.rolesService.hasAllDefaultPermissions(role.id);
      if (!hasAllPermissions) {
        await this.rolesService.updateRolePermissions(role.id);
      }
    }

    const existingAdmin = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      console.warn('⚠ SuperAdmin already exists. Checking role...');

      if (existingAdmin.roleId !== role.id) {
        await this.databaseService.user.update({
          where: { id: existingAdmin.id },
          data: { roleId: role.id },
        });

        return { message: 'SuperAdmin role updated successfully', user: existingAdmin };
      }

      return { message: 'SuperAdmin already has the correct role', user: existingAdmin };
    }

    const newUser = await this.databaseService.user.create({
      data: {
        name: 'admin',
        email,
        phone: '0000000000',
        roleId: role.id,
        login: {
          create: {
            username: 'admin',
            email,
            phone: '0000000000',
            password: hashedPassword,
          },
        },
      },
    });

    return { message: 'SuperAdmin created successfully', user: newUser };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password, deviceId } = loginDto;
    const userLogin = await this.databaseService.login.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }, { username: identifier }],
      },
      include: { user: { include: { role: { include: { permissions: true } } } } },
    });

    if (!userLogin || !(await bcrypt.compare(password, userLogin.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { id: userId, role } = userLogin.user;
    const roleName = role?.name || 'UNKNOWN';
    const permissions = role?.permissions?.map(p => p.name) || [];

    const accessToken = sign({ userId, deviceId, role: roleName, permissions }, JWT_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = sign({ userId, deviceId }, JWT_SECRET, { expiresIn: '7d' });
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.databaseService.token.deleteMany({ where: { userId, deviceId } });

    await this.databaseService.token.create({
      data: { userId, deviceId, accessToken, refreshToken: hashedRefreshToken },
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken, deviceId } = refreshTokenDto;
    try {
      const decoded = verify(refreshToken, JWT_SECRET) as { userId: string; deviceId: string };

      const tokenRecord = await this.databaseService.token.findFirst({
        where: { userId: decoded.userId, deviceId },
        include: { user: { include: { role: { include: { permissions: true } } } } },
      });

      if (!tokenRecord) throw new UnauthorizedException('Invalid refresh token');

      const isValid = await bcrypt.compare(refreshToken, tokenRecord.refreshToken);
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');

      const { id: userId, role } = tokenRecord.user;

      if (!role) throw new ForbiddenException('User has no assigned role');

      const permissions = role?.permissions?.map(p => p.name) || [];

      const newAccessToken = sign({ userId, deviceId, role: role.name, permissions }, JWT_SECRET, {
        expiresIn: '15m',
      });

      await this.databaseService.token.update({
        where: { id: tokenRecord.id },
        data: { accessToken: newAccessToken },
      });

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(logoutDto: LogoutDto) {
    const { userId, deviceId } = logoutDto;
    await this.databaseService.token.deleteMany({ where: { userId, deviceId } });
    return { message: 'Logged out from this device' };
  }

  async logoutAll(userId: string) {
    await this.databaseService.token.deleteMany({ where: { userId } });
    return { message: 'Logged out from all devices' };
  }
}
