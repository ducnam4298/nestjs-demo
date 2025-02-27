import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateEmployeeDto, FindAllEmployeeDto, UpdateEmployeeDto } from './employees.dto';
import { LoggerService } from '../logger';

@Injectable()
export class EmployeesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    LoggerService.log(`ℹ️ Creating new employee`, EmployeesService.name);

    try {
      const employee = await this.databaseService.employee.create({
        data: createEmployeeDto,
      });
      LoggerService.log(`✅ Employee created successfully: ${employee.id}`, EmployeesService.name);
      return employee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error creating employee`, errorMessage);
      throw error;
    }
  }

  async findAll(findAllEmployeeDto: FindAllEmployeeDto) {
    const { position } = findAllEmployeeDto;
    LoggerService.log(
      `ℹ️ Finding employees with position: ${position || 'No filter'}`,
      EmployeesService.name
    );

    try {
      const employees = position
        ? await this.databaseService.employee.findMany({
            where: findAllEmployeeDto,
          })
        : await this.databaseService.employee.findMany();
      return employees;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error finding employees`, errorMessage);
      throw error;
    }
  }

  async findOne(id: string) {
    LoggerService.log(`ℹ️ Finding employee with ID: ${id}`, EmployeesService.name);

    try {
      const employee = await this.databaseService.employee.findUnique({
        where: { id },
      });
      if (!employee) throw new Error('Employee not found');
      return employee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error finding employee with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    LoggerService.log(`ℹ️ Updating employee with ID: ${id}`, EmployeesService.name);

    try {
      const employee = await this.databaseService.employee.update({
        where: { id },
        data: updateEmployeeDto,
      });
      return employee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error updating employee with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing employee with ID: ${id}`, EmployeesService.name);

    try {
      const employee = await this.databaseService.employee.delete({
        where: { id },
      });
      return employee;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error removing employee with ID: ${id}`, errorMessage);
      throw error;
    }
  }
}
