import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule, PasswordService } from '@/auth';
import { DatabaseService } from '@/database';
import { RolesService } from '@/roles';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, DatabaseService, PasswordService, RolesService],
})
export class UsersModule {}
