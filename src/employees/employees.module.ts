import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { DatabaseModule } from '@/database';

@Module({
  imports: [DatabaseModule, JwtModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
})
export class EmployeesModule {}
