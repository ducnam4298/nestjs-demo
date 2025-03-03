import { forwardRef, Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { DatabaseService } from '@/database';
import { AccessStrategy } from '@/access_control/access.strategy';
import { UsersModule, UsersService } from '@/users';
import { RolesService } from '@/roles';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    forwardRef(() => UsersModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessStrategy,
    DatabaseService,
    RolesService,
    PasswordService,
    TokenService,
    UsersService,
  ],
  exports: [AuthService, JwtModule, PasswordService, TokenService],
})
export class AuthModule {}
