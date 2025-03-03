import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { DatabaseModule } from '@/database';

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
