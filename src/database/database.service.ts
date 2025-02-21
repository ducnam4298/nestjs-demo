import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    process.on('beforeExit', () => {
      void this.handleBeforeExit();
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      LoggerService.log('✅ Database connected successfully', DatabaseService.name);
    } catch (error) {
      LoggerService.error(
        '❌ Database connection failed',
        error instanceof Error ? error.stack : String(error)
      );
      process.exit(1);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async handleBeforeExit() {
    await this.$disconnect();
    LoggerService.log('🔌 Database disconnected', DatabaseService.name);
  }
}
