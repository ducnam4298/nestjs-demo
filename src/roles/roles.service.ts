import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignPermissionsForRole, CreateRoleDto, FindAllRoleDto } from './role.dto';
import { DEFAULT_PERMISSION } from '@/shared/constants';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/logger';
import { getValidSortField, retryTransaction } from '@/shared/utils';

@Injectable()
export class RolesService {
  constructor(private databaseService: DatabaseService) {}

  async assignPermissionsForRole(assignPermissionsForRole: AssignPermissionsForRole) {
    const { id, permissionIds } = assignPermissionsForRole;
    LoggerService.log(`ℹ️ Assigning permissions for role with ID: ${id}`, RolesService.name);

    return this.databaseService.$transaction(async db => {
      const existingRole = await db.role.findUnique({
        where: { id },
        include: { permissions: true },
      });
      if (!existingRole) {
        LoggerService.warn(`🚨 Role not found with ID: ${id}`, RolesService.name);
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
      const existingPermissionIds = new Set(existingRole.permissions.map(p => p.id));
      const newPermissionIds = permissionIds.filter(pid => !existingPermissionIds.has(pid));
      if (newPermissionIds.length === 0) {
        LoggerService.warn(`🚨 No new permissions to assign for role ID: ${id}`, RolesService.name);
        return existingRole;
      }
      const updatedRole = await db.role.update({
        where: { id },
        data: {
          permissions: { connect: newPermissionIds.map(permissionId => ({ id: permissionId })) },
        },
        include: { permissions: true },
      });
      LoggerService.log(
        `✅ Permissions assigned successfully for role with ID: ${id}`,
        RolesService.name
      );
      return updatedRole;
    });
  }

  async create(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;
    LoggerService.log(`ℹ️ Creating role with name: ${name}`, RolesService.name);

    if (!name) throw new BadRequestException('Name are required');
    const id = await retryTransaction<string>(async () => {
      const newRole = await this.databaseService.$transaction(async db =>
        db.role.create({
          data: {
            name,
            permissions: {
              create: DEFAULT_PERMISSION.map(perm => ({ name: perm, entity: name })),
            },
          },
          include: { permissions: true },
        })
      );
      LoggerService.log(`✅ Role created successfully: ${name}`, RolesService.name);
      return newRole.id;
    }, RolesService.name);
    return id;
  }

  async findAll(findAllRoleDto: FindAllRoleDto) {
    const { skip, take, sortBy, sortOrder, ...filters } = findAllRoleDto;
    LoggerService.log(
      `ℹ️ Finding roles with filters: ${JSON.stringify(filters)}, skip: ${skip}, take: ${take}`,
      RolesService.name
    );

    const hasUpdated = await this.databaseService.role.findFirst({
      where: { updatedAt: { not: null } },
      select: { updatedAt: true },
    });
    const { sortBy: finalSortBy, sortOrder: finalSortOrder } = await getValidSortField(
      'role',
      sortBy,
      sortOrder,
      !!hasUpdated
    );

    const roles = await this.databaseService.role.findMany({
      where: Object.keys(filters).length ? filters : undefined,
      skip,
      take,
      include: { permissions: true },
      orderBy: finalSortBy ? { [finalSortBy]: finalSortOrder } : undefined,
    });
    LoggerService.log(`✅ Found ${roles.length} roles`, RolesService.name);
    return roles;
  }

  async findOne(id: string) {
    LoggerService.log(`ℹ️ Finding role with ID: ${id}`, RolesService.name);
    const role = await this.databaseService.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!role) {
      LoggerService.warn(`🚨 Role not found with ID: ${id}`, RolesService.name);
      throw new NotFoundException('Role not found');
    }
    LoggerService.log(`✅ Role found: ${id}`, RolesService.name);
    return role;
  }

  async hasAllDefaultPermissions(id: string): Promise<boolean> {
    LoggerService.log(`ℹ️ Checking default permissions for role with ID: ${id}`, RolesService.name);
    const role = await this.findOne(id);
    const existingPermissions = new Set(role.permissions.map(p => p.entity));
    const hasAllPermissions = DEFAULT_PERMISSION.every(perm => existingPermissions.has(perm));
    LoggerService.log(
      `ℹ️ Role with ID: ${id} has all default permissions: ${hasAllPermissions}`,
      RolesService.name
    );
    return hasAllPermissions;
  }

  async updateRolePermissions(id: string) {
    LoggerService.log(`ℹ️ Updating permissions for role with ID: ${id}`, RolesService.name);
    return this.databaseService.$transaction(async db => {
      const role = await db.role.findUnique({
        where: { id },
        include: { permissions: true },
      });
      if (!role) {
        LoggerService.warn(`🚨 Role not found with ID: ${id}`, RolesService.name);
        throw new NotFoundException('Role not found');
      }
      const existingPermissions = role.permissions.map(p => p.name);
      const missingPermissions = DEFAULT_PERMISSION.filter(p => !existingPermissions.includes(p));
      if (missingPermissions.length > 0) {
        await db.permission.createMany({
          data: missingPermissions.map(p => ({ name: p, entity: role.name, roleId: role.id })),
          skipDuplicates: true,
        });
      }
      const updatedRole = await db.role.findUnique({
        where: { id },
        include: { permissions: true },
      });
      LoggerService.log(
        `✅ Permissions updated successfully for role with ID: ${id}`,
        RolesService.name
      );
      return updatedRole;
    });
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing role with ID: ${id}`, RolesService.name);
    return this.databaseService.$transaction(async db => {
      const existingRole = await db.role.findUnique({ where: { id } });
      if (!existingRole) {
        LoggerService.warn(`🚨 Role not found with ID: ${id}`, RolesService.name);
        throw new NotFoundException('Role not found');
      }
      await db.role.delete({ where: { id } });
      LoggerService.log(`✅ Role removed successfully: ${id}`, RolesService.name);
      return id;
    });
  }
}
