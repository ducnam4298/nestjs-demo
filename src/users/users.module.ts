import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseService } from '../database/database.service';
import { PasswordService } from '../auth/password.service';
import { RolesService } from '../roles';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [UsersService, DatabaseService, PasswordService, RolesService],
})
export class UsersModule {}
