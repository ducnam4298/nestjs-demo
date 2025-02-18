import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Ip,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Position, Prisma } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { LoggerService } from '../logger/logger.service';
import { JwtAuthGuard } from '../auth/strategy/jwt-auth.guard';

@SkipThrottle()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}
  private readonly logger = new LoggerService();
  @Post()
  create(@Body() createEmployeeDto: Prisma.EmployeeCreateInput) {
    return this.employeesService.create(createEmployeeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get()
  findAll(@Ip() ip: string, @Query('role') position?: Position) {
    this.logger.log(`Request for All Employees\t ${ip}`, EmployeesController.name);
    return this.employeesService.findAll(position);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: Prisma.EmployeeUpdateInput) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
