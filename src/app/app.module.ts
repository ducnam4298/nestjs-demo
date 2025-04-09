import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@/database';
import { AccessModule } from '@/access_control';
import { CleanStringMiddleware } from '@/middleware';
import { LoggerMiddleware } from '@/middleware';
import { throttlerConfig } from '@/config';
import { CoreModule } from '@/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(throttlerConfig),
    DatabaseModule,
    CoreModule,
    AccessModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware, CleanStringMiddleware).forRoutes('*path');
  }
}
