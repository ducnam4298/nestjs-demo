/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { DatabaseService } from '../database/database.service';
import { JWT_SECRET } from '../shared/constants';
import { Position, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService) {}
  async register(
    name: string,
    password: string,
    username?: string,
    email?: string,
    phone?: string
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const identifier = username || email || phone;

    if (!identifier) {
      throw new Error('Not empty identifier');
    }

    return this.databaseService.user.create({
      data: {
        name,
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

    return this.databaseService.user.create({
      data: {
        name: 'admin',
        email: 'admin@gmail.com',
        phone: '0000000000',
        role: Role.SUPER_ADMIN,
        login: {
          create: {
            username: 'admin',
            email: 'admin@gmail.com',
            phone: '0000000000',
            password: hashedPassword,
          },
        },
        employee: {
          create: {
            position: Position.MANAGER,
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
      include: { user: true },
    });

    if (!userLogin || !(await bcrypt.compare(password, userLogin.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const userId = userLogin.user.id;

    const accessToken = sign({ userId, deviceId }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = sign({ userId, deviceId }, JWT_SECRET, { expiresIn: '7d' });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.databaseService.token.deleteMany({ where: { userId, deviceId } });

    await this.databaseService.token.create({
      data: {
        userId,
        deviceId,
        accessToken,
        refreshToken: hashedRefreshToken,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string, deviceId: string) {
    try {
      const decoded = verify(refreshToken, JWT_SECRET) as {
        userId: string;
        deviceId: string;
      };

      const tokenRecord = await this.databaseService.token.findFirst({
        where: { userId: decoded.userId, deviceId },
      });

      if (!tokenRecord) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isValid = await bcrypt.compare(refreshToken, tokenRecord.refreshToken);
      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 🔹 Tạo Access Token mới
      const newAccessToken = sign({ userId: decoded.userId, deviceId }, JWT_SECRET, {
        expiresIn: '15m',
      });

      // 🔹 Cập nhật access token trong database
      await this.databaseService.token.update({
        where: { id: tokenRecord.id },
        data: { accessToken: newAccessToken },
      });

      return { accessToken: newAccessToken };
    } catch (error) {
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
