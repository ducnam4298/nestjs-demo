/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { JWT_SECRET } from '../shared/constants';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService) {}
  async register(
    name: string,
    roleId: string,
    password: string,
    username?: string,
    email?: string,
    phone?: string
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const identifier = username || email || phone;
    if (!identifier) throw new Error('Identifier is required');

    return this.databaseService.user.create({
      data: {
        name,
        roleId,
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
    let role = await this.databaseService.role.findUnique({
      where: { name: 'SUPER_ADMIN' },
    });
    if (!role) {
      role = await this.databaseService.role.create({
        data: { name: 'SUPER_ADMIN' },
      });
    }
    return this.databaseService.user.create({
      data: {
        name: 'Admin',
        email: 'admin@gmail.com',
        phone: '0000000000',
        roleId: role.id,
        login: {
          create: {
            username: 'admin',
            email: 'admin@gmail.com',
            phone: '0000000000',
            password: hashedPassword,
          },
        },
      },
    });
  }

  async login(identifier: string, password: string, deviceId: string) {
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
    const permissions = role?.permissions?.map(p => p.name) || [];

    const accessToken = sign({ userId, deviceId, role: role.name, permissions }, JWT_SECRET, {
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

  async refreshToken(refreshToken: string, deviceId: string) {
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

  async logout(userId: string, deviceId: string) {
    await this.databaseService.token.deleteMany({ where: { userId, deviceId } });
    return { message: 'Logged out from this device' };
  }

  async logoutAll(userId: string) {
    await this.databaseService.token.deleteMany({ where: { userId } });
    return { message: 'Logged out from all devices' };
  }
}
