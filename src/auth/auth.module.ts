import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { RolesService } from '../roles';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseService } from '../database/database.service';
import { AccessStrategy } from './access_control/access.strategy';
import { JWT_SECRET } from '../shared/constants';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessStrategy, DatabaseService, RolesService],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
