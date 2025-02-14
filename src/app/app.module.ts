import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmployeesModule } from '../employees';
import { DatabaseModule } from '../database/database.module';
import { LoggerModule } from '../logger';
import { UsersModule } from '../users';
import { AuthModule } from '../auth';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ name: 'long', ttl: 1000, limit: 5 }]),
    DatabaseModule,
    LoggerModule,
    AuthModule,
    EmployeesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
