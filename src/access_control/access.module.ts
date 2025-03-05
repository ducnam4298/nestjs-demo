import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AccessAuthGuard } from './access-auth.guard';
import { AuthModule } from '@/auth';

@Module({
  imports: [AuthModule],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessAuthGuard },
  ],
})
export class AccessModule {}
