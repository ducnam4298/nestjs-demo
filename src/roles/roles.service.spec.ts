import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { DatabaseService } from '@/database';
import { FilterService, PaginationService } from '@/services';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DEFAULT_PERMISSION } from '@/shared/constants';
import {
  retryTransaction,
  mockBeforeConsoleAndTimers,
  mockAfterConsoleAndTimers,
  filterServiceMock,
  paginationServiceMock,
  transactionMock,
} from '@/shared';
import { FindAllRoleDto } from './roles.dto';

describe('RolesService', () => {
  let rolesService: RolesService;

  const filterMock = filterServiceMock();
  const paginationMock = paginationServiceMock();

  const rolePM = {
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const permissionPM = { createMany: jest.fn() };
  const transaction = transactionMock({
    role: rolePM,
    permission: permissionPM,
  });

  const roleId = 'role-123';
  const newRoleId = 'role-456';
  const roleName = 'SUPER_ADMIN';
  const permDefault = DEFAULT_PERMISSION.map(perm => ({ name: perm, entity: roleName }));
  const permArrayObj = DEFAULT_PERMISSION.map(perm => ({
    id: `perm-${perm}`,
    name: perm,
    entity: roleName,
    createdAt: new Date(),
    updatedAt: null,
    roleId: roleId,
  }));
  const permissionsName = DEFAULT_PERMISSION.map(name => ({ name }));
  const role = {
    id: roleId,
    name: roleName,
    permissions: permDefault,
  };
  const rolePermissions = {
    id: roleId,
    name: roleName,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: permArrayObj,
  };
  const assignPermissionsForRole = {
    id: roleId,
    permissionIds: ['perm-1', 'perm-2'],
  };
  const existingRolePermissionIds = {
    id: roleId,
    permissions: [{ id: 'perm-1' }],
  };
  const updatedRolePermissionIds = {
    ...existingRolePermissionIds,
    permissions: [{ id: 'perm-1' }, { id: 'perm-2' }],
  };
  const filterResult = { modelName: 'role', sortBy: 'name', sortOrder: 'asc' };
  const paginatedResult = { data: [], total: 0 };
  const findAllRoleDto: FindAllRoleDto = {
    page: 1,
    pageRecords: 10,
    sortBy: 'name',
    sortOrder: 'asc',
  };
  const filteredPermissions = {
    ...rolePermissions,
    permissions: rolePermissions.permissions.filter(perm => perm.name !== DEFAULT_PERMISSION[0]),
  };
  const existingRolePermissionNames = {
    id: roleId,
    name: roleName,
    permissions: [{ name: 'VIEWS' }, { name: 'DETAIL' }],
  };
  const rolePermissionsName = {
    ...existingRolePermissionNames,
    permissions: permissionsName,
  };
  const permissionForRole = [
    { name: 'CREATE', entity: roleName, roleId },
    { name: 'UPDATE', entity: roleName, roleId },
    { name: 'DELETE', entity: roleName, roleId },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: DatabaseService,
          useValue: {
            role: rolePM,
            permission: permissionPM,
            $transaction: transaction,
          },
        },
        { provide: FilterService, useValue: filterMock },
        { provide: PaginationService, useValue: paginationMock },
      ],
    }).compile();

    rolesService = module.get<RolesService>(RolesService);

    mockBeforeConsoleAndTimers();
  });

  afterEach(() => {
    mockAfterConsoleAndTimers();
  });

  describe('assignPermissionsForRole', () => {
    it('should assign new permissions to a role', async () => {
      rolePM.findUnique.mockResolvedValue(existingRolePermissionIds);
      rolePM.update.mockResolvedValue(updatedRolePermissionIds);

      const result = await rolesService.assignPermissionsForRole(assignPermissionsForRole);

      expect(transaction).toHaveBeenCalled();
      expect(rolePM.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
        include: { permissions: true },
      });
      expect(rolePM.update).toHaveBeenCalledWith({
        where: { id: roleId },
        data: { permissions: { connect: [{ id: 'perm-2' }] } },
        include: { permissions: true },
      });
      expect(result).toEqual(updatedRolePermissionIds);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      rolePM.findUnique.mockResolvedValue(null);

      await expect(
        rolesService.assignPermissionsForRole({ id: roleId, permissionIds: ['perm-1'] })
      ).rejects.toThrow(NotFoundException);

      expect(rolePM.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
        include: { permissions: true },
      });
      expect(rolePM.update).not.toHaveBeenCalled();
    });

    it('should return existing role if no new permissions are assigned', async () => {
      rolePM.findUnique.mockResolvedValue(existingRolePermissionIds);

      const result = await rolesService.assignPermissionsForRole({
        id: roleId,
        permissionIds: ['perm-1'],
      });

      expect(result).toEqual(existingRolePermissionIds);
      expect(rolePM.findUnique).toHaveBeenCalled();
      expect(rolePM.update).not.toHaveBeenCalled();
    });
  });
  describe('create', () => {
    it('should create a role successfully', async () => {
      rolePM.create.mockResolvedValue(role);

      const result = await rolesService.create({ name: roleName });

      expect(retryTransaction).toHaveBeenCalledWith(expect.any(Function), RolesService.name);
      expect(transaction).toHaveBeenCalled();
      expect(rolePM.create).toHaveBeenCalledWith({
        data: {
          name: roleName,
          permissions: {
            create: permDefault,
          },
        },
        include: { permissions: true },
      });
      expect(result).toBe(role.id);
    });

    it('should throw BadRequestException if name is missing', async () => {
      await expect(rolesService.create({ name: '' })).rejects.toThrow(BadRequestException);
    });
  });
  describe('ensureRoleExists', () => {
    it('should return existing role ID if role exists', async () => {
      rolePM.findUnique.mockResolvedValue(existingRolePermissionIds);
      const mockUpdateRolePermissions = jest
        .spyOn(rolesService, 'updateRolePermissions')
        .mockResolvedValue(rolePermissions);

      const result = await rolesService.ensureRoleExists(roleName);

      expect(rolePM.findUnique).toHaveBeenCalledWith({ where: { name: roleName } });
      expect(mockUpdateRolePermissions).toHaveBeenCalledWith(existingRolePermissionIds.id);
      expect(result).toBe(existingRolePermissionIds.id);
    });

    it('should create a new role if not found', async () => {
      rolePM.findUnique.mockResolvedValue(null);

      const mockCreate = jest.spyOn(rolesService, 'create').mockResolvedValue(newRoleId);
      const result = await rolesService.ensureRoleExists(roleName);

      expect(rolePM.findUnique).toHaveBeenCalledWith({ where: { name: roleName } });
      expect(mockCreate).toHaveBeenCalledWith({ name: roleName });
      expect(result).toBe(newRoleId);
    });
  });
  describe('findAll', () => {
    it('should return paginated permissions', async () => {
      filterMock.getValidSortField.mockResolvedValue({
        sortBy: filterResult.sortBy,
        sortOrder: filterResult.sortOrder,
      });
      paginationMock.paginate.mockResolvedValue(paginatedResult);

      const result = await rolesService.findAll(findAllRoleDto);

      expect(filterMock.getValidSortField).toHaveBeenCalledWith(
        filterResult.modelName,
        filterResult.sortBy,
        filterResult.sortOrder
      );
      expect(paginationMock.paginate).toHaveBeenCalledWith(
        filterResult.modelName,
        expect.any(Object),
        findAllRoleDto.page,
        findAllRoleDto.pageRecords,
        filterResult.sortBy,
        filterResult.sortOrder
      );
      expect(result).toEqual(paginatedResult);
    });
  });
  describe('findOne', () => {
    it('should return the role if found', async () => {
      rolePM.findUnique.mockResolvedValue(role);

      const result = await rolesService.findOne(roleId);

      expect(rolePM.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
        include: { permissions: true },
      });

      expect(result).toEqual(role);
    });

    it('should throw NotFoundException if role not found', async () => {
      rolePM.findUnique.mockResolvedValue(null);

      await expect(rolesService.findOne(roleId)).rejects.toThrow(NotFoundException);
      expect(rolePM.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
        include: { permissions: true },
      });
    });
  });
  describe('hasAllDefaultPermissions', () => {
    it('should return true if role has all default permissions', async () => {
      jest.spyOn(rolesService, 'findOne').mockResolvedValue(rolePermissions);

      const result = await rolesService.hasAllDefaultPermissions(roleId);

      expect(result).toBe(true);
    });

    it('should return false if role is missing any default permission', async () => {
      jest.spyOn(rolesService, 'findOne').mockResolvedValue(filteredPermissions);

      const result = await rolesService.hasAllDefaultPermissions(roleId);

      expect(result).toBe(false);
    });
  });
  describe('updateRolePermissions', () => {
    it('should update permissions if missing and return updated role', async () => {
      rolePM.findUnique.mockResolvedValueOnce(existingRolePermissionNames);
      permissionPM.createMany.mockResolvedValue(null);

      const result = await rolesService.updateRolePermissions(roleId);

      expect(result).toEqual(rolePermissionsName);
      expect(permissionPM.createMany).toHaveBeenCalledWith({
        data: permissionForRole,
        skipDuplicates: true,
      });
    });

    it('should not update if role already has all permissions', async () => {
      rolePM.findUnique.mockResolvedValueOnce(rolePermissionsName);

      const result = await rolesService.updateRolePermissions(roleId);

      expect(result).toEqual(rolePermissionsName);
      expect(permissionPM.createMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if role does not exist', async () => {
      rolePM.findUnique.mockResolvedValueOnce(null);

      await expect(rolesService.updateRolePermissions(roleId)).rejects.toThrow(NotFoundException);
      expect(rolePM.findUnique).toHaveBeenCalled();
      expect(permissionPM.createMany).not.toHaveBeenCalled();
    });
  });
  describe('remove', () => {
    it('should remove role successfully and return id', async () => {
      rolePM.findUnique.mockResolvedValue({ id: roleId });
      rolePM.delete.mockResolvedValue({ id: roleId });

      await expect(rolesService.remove(roleId)).resolves.toBe(roleId);

      expect(transaction).toHaveBeenCalled();
      expect(rolePM.findUnique).toHaveBeenCalledWith({
        where: { id: roleId },
      });
      expect(rolePM.delete).toHaveBeenCalledWith({
        where: { id: roleId },
      });
    });

    it('should throw NotFoundException if role does not exist', async () => {
      rolePM.findUnique.mockResolvedValue(null);

      await expect(rolesService.remove(roleId)).rejects.toThrow(NotFoundException);
      expect(rolePM.findUnique).toHaveBeenCalled();
      expect(rolePM.delete).not.toHaveBeenCalled();
    });
  });
});
