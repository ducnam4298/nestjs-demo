import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { FindAllEmployeeDto } from './employees.dto';
import { DatabaseService } from '@/database';
import { FilterService, PaginationService } from '@/services';
import {
  Position,
  mockBeforeConsoleAndTimers,
  mockAfterConsoleAndTimers,
  retryTransaction,
  filterServiceMock,
  paginationServiceMock,
  transactionMock,
} from '@/shared';

describe('EmployeesService', () => {
  let employeesService: EmployeesService;

  const filterMock = filterServiceMock();
  const paginationMock = paginationServiceMock();

  const employeePM = {
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };

  const transaction = transactionMock({
    employee: employeePM,
  });

  const employeeId = 'employ-123';
  const position = Position.DESIGNER;
  const employeeDto = { position };
  const employee = { id: employeeId, ...employeeDto };
  const existingEmployee = { id: employeeId, position };
  const filterResult = { modelName: 'employee', sortBy: 'name', sortOrder: 'asc' };
  const paginatedResult = { data: [], total: 0 };
  const findAllEmployeeDto: FindAllEmployeeDto = {
    page: 1,
    pageRecords: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        {
          provide: DatabaseService,
          useValue: {
            employee: employeePM,
            $transaction: transaction,
          },
        },
        { provide: FilterService, useValue: filterMock },
        { provide: PaginationService, useValue: paginationMock },
      ],
    }).compile();

    employeesService = module.get<EmployeesService>(EmployeesService);

    mockBeforeConsoleAndTimers();
  });

  afterEach(() => {
    mockAfterConsoleAndTimers();
  });

  describe('create', () => {
    it('should create an employee and return the id', async () => {
      employeePM.create.mockResolvedValue(employee);
      const employeeId = await employeesService.create(employeeDto);

      expect(retryTransaction).toHaveBeenCalledWith(expect.any(Function), EmployeesService.name);
      expect(employeeId).toBe(employee.id);
    });
  });

  describe('findAll', () => {
    it('should return paginated employees', async () => {
      paginationMock.paginate.mockResolvedValue(paginatedResult);
      const result = await employeesService.findAll(findAllEmployeeDto);
      expect(filterMock.getValidSortField).toHaveBeenCalledWith(
        filterResult.modelName,
        filterResult.sortBy,
        filterResult.sortOrder
      );
      expect(paginationMock.paginate).toHaveBeenCalledWith(
        filterResult.modelName,
        expect.any(Object),
        findAllEmployeeDto.page,
        findAllEmployeeDto.pageRecords,
        filterResult.sortBy,
        filterResult.sortOrder
      );
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return an employee if found', async () => {
      employeePM.findUnique.mockResolvedValue(employee);
      const result = await employeesService.findOne(employeeId);
      expect(result).toEqual(employee);
    });

    it('should throw NotFoundException if employee is not found', async () => {
      employeePM.findUnique.mockResolvedValue(null);
      await expect(employeesService.findOne(employeeId)).rejects.toThrow(
        new NotFoundException('Employee not found')
      );
    });
  });

  describe('update', () => {
    it('should update an employee and return updated employee', async () => {
      employeePM.findUnique.mockResolvedValue(existingEmployee);
      employeePM.update.mockResolvedValue(employee);

      const result = await employeesService.update(employeeId, employeeDto);
      expect(result).toEqual(employee);
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      employeePM.findUnique.mockResolvedValue(null);

      await expect(employeesService.update(employeeId, employeeDto)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('remove', () => {
    it('should remove the employee and return id', async () => {
      employeePM.findUnique.mockResolvedValue(existingEmployee);
      employeePM.delete.mockResolvedValue(employeeId);

      const result = await employeesService.remove(employeeId);
      expect(transaction).toHaveBeenCalled();
      expect(result).toBe(employeeId);
    });
    it('should throw NotFoundException if employee does not exist', async () => {
      employeePM.findUnique.mockResolvedValue(null);

      await expect(employeesService.remove(employeeId)).rejects.toThrow(
        new NotFoundException('Employee not found')
      );
    });
  });
});
