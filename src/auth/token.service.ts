import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/services';
import { ActionTokenEmailPayload, TokenPayload } from '@/shared';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService
  ) {}

  verifyToken(token: string, allowExpired = false): TokenPayload | ActionTokenEmailPayload {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      LoggerService.warn('🚨 Token verification failed', TokenService.name);

      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          if (allowExpired) {
            const payload: ActionTokenEmailPayload = this.jwtService.decode(token);
            if (!payload) throw new UnauthorizedException('Token decoding failed');
            console.log(payload);
            return payload;
          }
          throw new UnauthorizedException('Token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid token');
        }
      }

      throw new UnauthorizedException('Token verification failed');
    }
  }

  async generateTokens(userId: string, deviceId: string) {
    if (!userId) throw new UnauthorizedException('Invalid userId data');

    LoggerService.log(`ℹ️ Generating tokens for user ${userId}`, TokenService.name);

    const accessToken = this.jwtService.sign(
      { userId, deviceId },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1h',
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
  }

  generateActionTokenEmail(email: string, type: string) {
    const payload = { email, type };
    const actionTokenEmail = this.jwtService.sign(payload, {
      expiresIn: '5m',
      secret: this.configService.get<string>('JWT_SECRET'),
    });
    return actionTokenEmail;
  }

  async refreshAccessToken(refreshToken: string, deviceId: string) {
    const decoded = this.jwtService.verify<{ userId: string; deviceId: string }>(refreshToken, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    LoggerService.log(`ℹ️ Refreshing access token for user ${decoded.userId}`, TokenService.name);

    const tokenRecord = await this.databaseService.token.findFirst({
      where: { userId: decoded.userId, deviceId },
      include: {
        user: {
          include: { role: { include: { permissions: { select: { id: true, name: true } } } } },
        },
      },
    });

    if (!tokenRecord || !tokenRecord.user) {
      throw new UnauthorizedException('User not found');
    }

    if (!(await bcrypt.compare(refreshToken, tokenRecord.refreshToken))) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(tokenRecord.userId, deviceId);
  }

  async invalidateToken(userId: string, deviceId: string) {
    LoggerService.log(
      `ℹ️ Invalidating token for user ${userId} on device ${deviceId}`,
      TokenService.name
    );
    return this.databaseService.$transaction(async db => {
      await db.token.deleteMany({ where: { userId, deviceId } });
      LoggerService.log(
        `✅ TokenService invalidating successfully for user: ${userId}`,
        TokenService.name
      );
      return userId;
    });
  }

  async invalidateAllTokens(userId: string) {
    LoggerService.log(`ℹ️ Invalidating all tokens for user ${userId}`, TokenService.name);
    return this.databaseService.$transaction(async db => {
      await db.token.deleteMany({ where: { userId } });
      LoggerService.log(
        `✅ TokenService invalidating all successfully for user: ${userId}`,
        TokenService.name
      );
      return userId;
    });
  }
}
