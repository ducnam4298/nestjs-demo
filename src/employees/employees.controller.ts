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
import { AccessAuthGuard } from '../auth/access_control/access-auth.guard';
import { FindAllEmployeeDto, UpdateEmployeeDto } from './employees.dto';

@SkipThrottle()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}
  private readonly logger = new LoggerService();

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post()
  create(@Body() createEmployeeDto: Prisma.EmployeeCreateInput) {
    return this.employeesService.create(createEmployeeDto);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get()
  findAll(@Ip() ip: string, @Query('findAllEmployeeDto') findAllEmployeeDto: FindAllEmployeeDto) {
    this.logger.log(`Request for All Employees\t ${ip}`, EmployeesController.name);
    return this.employeesService.findAll(findAllEmployeeDto);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
