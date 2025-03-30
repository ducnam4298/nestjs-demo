import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { FindAllPermissionDto } from './permissions.dto';
import { DatabaseService } from '@/database';
import { FilterService, PaginationService } from '@/services';
import { RolesService } from '@/roles';
import {
  mockBeforeConsoleAndTimers,
  mockAfterConsoleAndTimers,
  retryTransaction,
  filterServiceMock,
  paginationServiceMock,
  transactionMock,
} from '@/shared';

describe('PermissionsService', () => {
  let permissionsService: PermissionsService;

  const filterMock = filterServiceMock();
  const paginationMock = paginationServiceMock();

  const permissionPM = {
    create: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const transaction = transactionMock({
    permission: permissionPM,
  });
  const rolesService = { findOne: jest.fn() };

  const roleId = 'role-123';
  const permissionId = 'perm-123';
  const permissionDto = { name: 'READ', entity: 'User', roleId: roleId };
  const permission = { id: permissionId, ...permissionDto };
  const existingPermission = { id: 'perm-456', ...permissionDto };
  const invalidRoleId = 'invalid-roleId';
  const invalidData = { name: '', entity: '', roleId: '' };
  const filterResult = { modelName: 'permission', sortBy: 'name', sortOrder: 'asc' };
  const paginatedResult = { data: [], total: 0 };
  const findAllPermissionDto: FindAllPermissionDto = {
    page: 1,
    pageRecords: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: DatabaseService,
          useValue: {
            permission: permissionPM,
            $transaction: transaction,
          },
        },
        {
          provide: RolesService,
          useValue: rolesService,
        },
        { provide: FilterService, useValue: filterMock },
        { provide: PaginationService, useValue: paginationMock },
      ],
    }).compile();

    permissionsService = module.get<PermissionsService>(PermissionsService);

    mockBeforeConsoleAndTimers();
  });

  afterEach(() => {
    mockAfterConsoleAndTimers();
  });

  describe('create', () => {
    it('should create a new permission', async () => {
      rolesService.findOne.mockResolvedValue({ id: roleId });
      permissionPM.findFirst.mockResolvedValue(null);
      permissionPM.create.mockResolvedValue(permission);

      const permissionId = await permissionsService.create(permissionDto);
      expect(retryTransaction).toHaveBeenCalledWith(expect.any(Function), PermissionsService.name);
      expect(transaction).toHaveBeenCalled();
      expect(permissionPM.findFirst).not.toHaveBeenCalledWith();
      expect(permissionPM.create).toHaveBeenCalledWith({
        data: permissionDto,
      });
      expect(permissionId).toBe(permission.id);
    });

    it('should throw BadRequestException if required fields are missing', async () => {
      await expect(permissionsService.create(invalidData)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      rolesService.findOne.mockResolvedValue(null);

      await expect(
        permissionsService.create({ ...permissionDto, roleId: invalidRoleId })
      ).rejects.toThrow(NotFoundException);
    });

    it('should return existing permission if already exists', async () => {
      rolesService.findOne.mockResolvedValue({ id: roleId });
      permissionPM.findFirst.mockResolvedValue(existingPermission);

      const permissionId = await permissionsService.create(permissionDto);
      expect(retryTransaction).toHaveBeenCalledWith(expect.any(Function), PermissionsService.name);
      expect(transaction).toHaveBeenCalled();
      expect(permissionPM.findFirst).toHaveBeenCalled();
      expect(permissionPM.create).not.toHaveBeenCalled();
      expect(permissionId).toBe(existingPermission.id);
    });
  });

  describe('findAll', () => {
    it('should return paginated permissions', async () => {
      filterMock.getValidSortField.mockResolvedValue({
        sortBy: filterResult.sortBy,
        sortOrder: filterResult.sortOrder,
      });
      paginationMock.paginate.mockResolvedValue(paginatedResult);
      const result = await permissionsService.findAll(findAllPermissionDto);
      expect(filterMock.getValidSortField).toHaveBeenCalledWith(
        filterResult.modelName,
        filterResult.sortBy,
        filterResult.sortOrder
      );
      expect(paginationMock.paginate).toHaveBeenCalledWith(
        filterResult.modelName,
        expect.any(Object),
        findAllPermissionDto.page,
        findAllPermissionDto.pageRecords,
        filterResult.sortBy,
        filterResult.sortOrder
      );
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('update', () => {
    it('should update an existing permission', async () => {
      permissionPM.findUnique.mockResolvedValue(existingPermission);
      permissionPM.update.mockResolvedValue(permission);

      const result = await permissionsService.update(permissionId, permissionDto);
      expect(permissionPM.findUnique).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
      expect(permissionPM.update).toHaveBeenCalledWith({
        where: { id: permissionId },
        data: permissionDto,
      });
      expect(result).toEqual(permission);
    });

    it('should throw NotFoundException if permission does not exist', async () => {
      permissionPM.findUnique.mockResolvedValue(null);

      await expect(permissionsService.update(permissionId, permissionDto)).rejects.toThrow(
        NotFoundException
      );
      expect(permissionPM.findUnique).toHaveBeenCalled();
      expect(permissionPM.delete).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete an existing permission', async () => {
      permissionPM.findUnique.mockResolvedValue(existingPermission);
      permissionPM.delete.mockResolvedValue({});

      const result = await permissionsService.remove(permissionId);
      expect(permissionPM.findUnique).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
      expect(permissionPM.delete).toHaveBeenCalledWith({
        where: { id: permissionId },
      });
      expect(result).toBe(permissionId);
    });

    it('should throw NotFoundException if permission does not exist', async () => {
      permissionPM.findUnique.mockResolvedValue(null);

      await expect(permissionsService.remove(permissionId)).rejects.toThrow(NotFoundException);
      expect(permissionPM.findUnique).toHaveBeenCalled();
      expect(permissionPM.delete).not.toHaveBeenCalled();
    });
  });
});
