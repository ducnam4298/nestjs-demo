import { Injectable, NotFoundException } from '@nestjs/common';
import { AssignPermissionsForRole, CreateRoleDto, FindAllRoleDto } from './role.dto';
import { DEFAULT_PERMISSION } from '@/shared/constants';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/logger';

@Injectable()
export class RolesService {
  constructor(private databaseService: DatabaseService) {}

  async assignPermissionsForRole(assignPermissionsForRole: AssignPermissionsForRole) {
    const { id, permissionIds } = assignPermissionsForRole;
    LoggerService.log(`ℹ️ Assigning permissions for role with ID: ${id}`, RolesService.name);

    try {
      const existingRole = await this.databaseService.role.findUnique({
        where: { id },
        include: { permissions: true },
      });

      if (!existingRole) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }

      const existingPermissionIds = new Set(existingRole.permissions.map(p => p.id));
      const newPermissionIds = permissionIds.filter(pid => !existingPermissionIds.has(pid));

      if (newPermissionIds.length === 0) {
        LoggerService.warn(`🚨 No new permissions to assign for role ID: ${id}`, RolesService.name);
        return existingRole;
      }

      const updatedRole = await this.databaseService.role.update({
        where: { id },
        data: {
          permissions: {
            connect: newPermissionIds.map(permissionId => ({ id: permissionId })),
          },
        },
        include: { permissions: true },
      });

      LoggerService.log(
        `✅ Permissions assigned successfully for role with ID: ${id}`,
        RolesService.name
      );
      return updatedRole;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error(`❌ Error assigning permissions for role with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  async create(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;
    LoggerService.log(`ℹ️ Creating role with name: ${name}`, RolesService.name);

    try {
      const role = await this.databaseService.role.create({
        data: {
          name: name,
          permissions: {
            create: DEFAULT_PERMISSION.map(perm => ({
              name: perm,
              entity: name,
            })),
          },
        },
        include: { permissions: true },
      });
      LoggerService.log(`✅ Role created successfully: ${name}`, RolesService.name);
      return role;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error(`❌ Error creating role: ${name}`, errorMessage);
      throw error;
    }
  }

  async findAll(findAllRoleDto?: FindAllRoleDto) {
    LoggerService.log('ℹ️ Finding all roles', RolesService.name);

    if (findAllRoleDto) {
      return await this.databaseService.role.findMany({
        where: findAllRoleDto,
        include: { permissions: true },
      });
    }

    return this.databaseService.role.findMany({ include: { permissions: true } });
  }

  async findOne(id: string) {
    LoggerService.log(`ℹ️ Finding role with ID: ${id}`, RolesService.name);
    return this.databaseService.role.findUnique({ where: { id }, include: { permissions: true } });
  }

  async hasAllDefaultPermissions(id: string): Promise<boolean> {
    LoggerService.log(`ℹ️ Checking default permissions for role with ID: ${id}`, RolesService.name);

    const role = await this.databaseService.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!role) return false;

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

    const role = await this.databaseService.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!role) {
      LoggerService.error(`❌ Role not found with ID: ${id}`, RolesService.name);
      throw new NotFoundException('Role not found');
    }
    const existingPermissions = role.permissions.map(p => p.name);
    const missingPermissions = DEFAULT_PERMISSION.filter(p => !existingPermissions.includes(p));

    if (missingPermissions.length > 0) {
      await this.databaseService.permission.createMany({
        data: missingPermissions.map(p => ({
          name: p,
          entity: role.name,
          roleId: role.id,
        })),
        skipDuplicates: true,
      });
    }

    const updatedRole = await this.databaseService.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    LoggerService.log(
      `✅ Permissions updated successfully for role with ID: ${id}`,
      RolesService.name
    );
    return updatedRole;
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing role with ID: ${id}`, RolesService.name);
    return this.databaseService.role.delete({ where: { id } });
  }
}
