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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, FindAllEmployeeDto, UpdateEmployeeDto } from './employees.dto';
import { Roles, Permissions } from '@/access_control/access.decorator';
import { AccessAuthGuard } from '@/access_control';
import { LoggerService } from '@/logger';

@UseGuards(AccessAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Roles('SUPER_ADMIN')
  @Permissions('CREATE')
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Roles('SUPER_ADMIN', 'USER')
  @Permissions('VIEWS')
  @Get()
  findAll(@Ip() ip: string, @Query('findAllEmployeeDto') findAllEmployeeDto: FindAllEmployeeDto) {
    LoggerService.log(`ℹ️ Request for All Employees\t ${ip}`, EmployeesController.name);
    return this.employeesService.findAll(findAllEmployeeDto);
  }

  @Roles('SUPER_ADMIN', 'USER')
  @Permissions('DETAIL')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('UPDATE')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('DELETE')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
