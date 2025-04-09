import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto, FindAllEmployeeDto, UpdateEmployeeDto } from './employees.dto';
import { DatabaseService } from '@/database';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { retryTransaction } from '@/shared';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    LoggerService.log(`ℹ️ Creating new employee`, EmployeesService.name);
    const id = await retryTransaction<string>(async () => {
      const newEmployee = await this.databaseService.employee.create({
        data: createEmployeeDto,
      });
      LoggerService.log(
        `✅ Employee created successfully: ${newEmployee.id}`,
        EmployeesService.name
      );
      return newEmployee.id;
    }, EmployeesService.name);

    return id;
  }

  async findAll(findAllEmployeeDto: FindAllEmployeeDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllEmployeeDto;
    const model = 'employee';
    LoggerService.log(
      `ℹ️ Finding employees with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      EmployeesService.name
    );

    const { sortBy: finalSortBy, sortOrder: finalSortOrder } =
      await this.filterService.getValidSortField(model, sortBy, sortOrder);

    return this.paginationService.paginate(
      model,
      filters,
      page,
      pageRecords,
      finalSortBy,
      finalSortOrder
    );
  }

  async findOne(id: string) {
    LoggerService.log(`ℹ️ Finding employee with ID: ${id}`, EmployeesService.name);
    const employee = await this.databaseService.employee.findUnique({
      where: { id },
    });
    if (!employee) {
      LoggerService.warn(`🚨 Employee not found with ID: ${id}`, EmployeesService.name);
      throw new NotFoundException('Employee not found');
    }
    LoggerService.log(`✅ Employee found: ${employee.id}`, EmployeesService.name);
    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    LoggerService.log(`ℹ️ Updating employee with ID: ${id}`, EmployeesService.name);
    const existingEmployee = await this.databaseService.employee.findUnique({ where: { id } });
    if (!existingEmployee) {
      LoggerService.warn(`🚨 Employee not found for update with ID: ${id}`, EmployeesService.name);
      throw new NotFoundException('Employee not found');
    }
    const updatedEmployee = await this.databaseService.employee.update({
      where: { id },
      data: updateEmployeeDto,
    });
    LoggerService.log(
      `✅ Employee updated successfully: ${updatedEmployee.id}`,
      EmployeesService.name
    );
    return updatedEmployee;
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing employee with ID: ${id}`, EmployeesService.name);
    return this.databaseService.$transaction(async db => {
      const existingEmployee = await db.employee.findUnique({ where: { id } });
      if (!existingEmployee) {
        LoggerService.warn(
          `🚨 Employee not found for deletion with ID: ${id}`,
          EmployeesService.name
        );
        throw new NotFoundException('Employee not found');
      }
      await db.employee.delete({ where: { id } });
      LoggerService.log(`✅ Employee removed successfully: ${id}`, EmployeesService.name);
      return id;
    });
  }
}
