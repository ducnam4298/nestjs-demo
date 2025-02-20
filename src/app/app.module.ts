import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users';
import { AuthModule } from '../auth';
import { RolesModule } from '../roles';
import { PermissionsModule } from '../permissions';
import { AccessModule } from '../auth/access_control/access.module';
import throttlerConfig from '../config/throttler.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load biến môi trường từ .env
    ThrottlerModule.forRoot(throttlerConfig),
    DatabaseModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AccessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
