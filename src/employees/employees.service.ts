import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateEmployeeDto, FindAllEmployeeDto, UpdateEmployeeDto } from './employees.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    return this.databaseService.employee.create({
      data: createEmployeeDto,
    });
  }

  async findAll(findAllEmployeeDto: FindAllEmployeeDto) {
    const { position } = findAllEmployeeDto;
    if (position) {
      return this.databaseService.employee.findMany({
        where: findAllEmployeeDto,
      });
    }
    return this.databaseService.employee.findMany();
  }

  async findOne(id: string) {
    return this.databaseService.employee.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    return this.databaseService.employee.update({
      where: {
        id,
      },
      data: updateEmployeeDto,
    });
  }

  async remove(id: string) {
    return this.databaseService.employee.delete({
      where: {
        id,
      },
    });
  }
}
