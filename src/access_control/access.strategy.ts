import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  ExtractJwt,
  JwtFromRequestFunction,
  Strategy,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@/services';

export interface JwtPayload {
  userId: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secretOrKey = configService.get<string>('JWT_SECRET');
    if (!secretOrKey) {
      throw new InternalServerErrorException('JWT_SECRET is not defined in configuration');
    }
    const jwtFromRequest: JwtFromRequestFunction = (
      ExtractJwt.fromAuthHeaderAsBearerToken as unknown as () => JwtFromRequestFunction
    )();
    const options: StrategyOptionsWithoutRequest = {
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey,
    };

    super(options);
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    LoggerService.log(`ℹ️ Validating token for userId: ${payload.userId}`, AccessStrategy.name);
    if (!payload || !payload.userId) {
      LoggerService.warn('🚨 Token validation failed: Invalid payload', AccessStrategy.name);
      throw new UnauthorizedException('Invalid token payload');
    }
    LoggerService.log(`✅ Token validated for userId: ${payload.userId}`, AccessStrategy.name);
    await Promise.resolve();
    return payload;
  }
}
