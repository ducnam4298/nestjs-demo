import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@/database';
import { AuthModule } from '@/auth';
import { UsersModule } from '@/users';
import { AccessModule } from '@/access_control';
import { RolesModule } from '@/roles';
import { PermissionsModule } from '@/permissions';
import { LoggerMiddleware } from '@/logger';
import { throttlerConfig } from '@/config';

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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Áp dụng LoggerMiddleware cho tất cả các route
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
