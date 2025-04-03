import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, FindAllEmployeeDto, UpdateEmployeeDto } from './employees.dto';
import { ApiController, Metadata } from '@/access_control';

@ApiController('Employees', FindAllEmployeeDto)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiBody({ type: CreateEmployeeDto })
  @Post()
  async create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all employees' })
  @Get()
  async findAll(@Query() findAllEmployeeDto: FindAllEmployeeDto) {
    return this.employeesService.findAll(findAllEmployeeDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Get a specific employee by id' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update employee by id' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @ApiBody({ type: UpdateEmployeeDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @ApiOperation({ summary: 'Delete employee by id' })
  @ApiParam({ name: 'id', type: String, description: 'Employee ID' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
