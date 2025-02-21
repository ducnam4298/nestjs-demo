import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, DatabaseService],
})
export class UsersModule {}
