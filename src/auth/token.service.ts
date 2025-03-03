import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/logger';

interface Permission {
  name: string;
}

interface Role {
  name: string;
  permissions?: Permission[];
}

interface User {
  id: string;
  role?: Role | null;
}

interface TokenPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {}

  verifyToken(token: string): TokenPayload {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      LoggerService.warn('🚨 Token verification failed', TokenService.name);

      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid token');
        }
      }

      throw new UnauthorizedException('Token verification failed');
    }
  }

  async generateTokens(user: User, deviceId: string) {
    if (!user || !user.id) throw new UnauthorizedException('Invalid user data');

    const { id: userId, role } = user;
    if (!role) throw new ForbiddenException('User has no assigned role');
    const roleName = role?.name || 'UNKNOWN';
    const permissions: string[] = role?.permissions?.map(p => p.name) || [];

    LoggerService.log(`ℹ️ Generating tokens for user ${userId}`, TokenService.name);

    const accessToken = this.jwtService.sign(
      { userId, deviceId, role: roleName, permissions },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }
    );

    const refreshToken = this.jwtService.sign(
      { userId, deviceId },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      }
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    try {
      return await this.databaseService.$transaction(async db => {
        LoggerService.log(
          `ℹ️ Deleting old tokens for user ${userId} on device ${deviceId}`,
          TokenService.name
        );

        await db.token.deleteMany({ where: { userId, deviceId } });

        LoggerService.log(
          `ℹ️ Creating new tokens for user ${userId} on device ${deviceId}`,
          TokenService.name
        );

        await db.token.create({
          data: { userId, deviceId, accessToken, refreshToken: hashedRefreshToken },
        });

        LoggerService.log(
          `✅ New tokens created for user ${userId} on device ${deviceId}`,
          TokenService.name
        );

        return { accessToken, refreshToken };
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error('❌ Token generation failed', errorMessage);
      throw new InternalServerErrorException(`❌ Token generation failed, ${errorMessage}`);
    }
  }

  async refreshAccessToken(refreshToken: string, deviceId: string) {
    try {
      const decoded = this.jwtService.verify<{ userId: string; deviceId: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      LoggerService.log(`ℹ️ Refreshing access token for user ${decoded.userId}`, TokenService.name);

      const tokenRecord = await this.databaseService.token.findFirst({
        where: { userId: decoded.userId, deviceId },
        include: { user: { include: { role: { include: { permissions: true } } } } },
      });

      if (!tokenRecord || !tokenRecord.user) {
        throw new UnauthorizedException('User not found');
      }

      if (!(await bcrypt.compare(refreshToken, tokenRecord.refreshToken))) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(tokenRecord.user, deviceId);
    } catch (error) {
      LoggerService.error('❌Refresh token validation failed', TokenService.name);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async invalidateToken(userId: string, deviceId: string) {
    LoggerService.log(
      `ℹ️ Invalidating token for user ${userId} on device ${deviceId}`,
      TokenService.name
    );
    await this.databaseService.token.deleteMany({ where: { userId, deviceId } });
  }

  async invalidateAllTokens(userId: string) {
    LoggerService.log(`ℹ️ Invalidating all tokens for user ${userId}`, TokenService.name);
    await this.databaseService.token.deleteMany({ where: { userId } });
  }
}
