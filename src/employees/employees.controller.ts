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
import { EmployeesService } from './employees.service';
import { LoggerService } from '../logger/logger.service';
import { AccessAuthGuard } from '../auth/access_control/access-auth.guard';
import { CreateEmployeeDto, FindAllEmployeeDto, UpdateEmployeeDto } from './employees.dto';

@SkipThrottle()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @UseGuards(AccessAuthGuard)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @UseGuards(AccessAuthGuard)
  @Get()
  findAll(@Ip() ip: string, @Query('findAllEmployeeDto') findAllEmployeeDto: FindAllEmployeeDto) {
    LoggerService.log(`ℹ️ Request for All Employees\t ${ip}`, EmployeesController.name);
    return this.employeesService.findAll(findAllEmployeeDto);
  }

  @UseGuards(AccessAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @UseGuards(AccessAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @UseGuards(AccessAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
