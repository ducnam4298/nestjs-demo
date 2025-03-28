import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignPermissionsForRole, CreateRoleDto, FindAllRoleDto } from './roles.dto';
import { DEFAULT_PERMISSION } from '@/shared/constants';
import { DatabaseService } from '@/database';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { retryTransaction } from '@/shared';

@Injectable()
export class RolesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}

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

  async ensureRoleExists(name: string) {
    const existingRole = await this.databaseService.role.findUnique({ where: { name } });

    if (existingRole) {
      LoggerService.debug(
        `🔍 Role "${name}" already exists with ID: ${existingRole.id}`,
        'RolesService'
      );
      await this.updateRolePermissions(existingRole.id);
      return existingRole.id;
    }

    LoggerService.log(`🆕 Role "${name}" not found. Creating a new one...`, 'RolesService');

    const id = await this.create({ name });

    LoggerService.log(`✅ Created new role "${name}" with ID: ${id}`, 'RolesService');
    return id;
  }

  async findAll(findAllRoleDto: FindAllRoleDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllRoleDto;
    const model = 'role';
    LoggerService.log(
      `ℹ️ Finding roles with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      RolesService.name
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
    const existingPermissions = new Set(role.permissions.map(p => p.name));
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
      LoggerService.warn(`🚨 Role not found with ID: ${id}`, RolesService.name);
      throw new NotFoundException('Role not found');
    }
    const existingPermissions = new Set(role.permissions.map(p => p.name));
    const missingPermissions = DEFAULT_PERMISSION.filter(p => !existingPermissions.has(p));
    if (missingPermissions.length > 0) {
      await this.databaseService.permission.createMany({
        data: missingPermissions.map(p => ({ name: p, entity: role.name, roleId: role.id })),
        skipDuplicates: true,
      });
      LoggerService.log(
        `✅ Added ${missingPermissions.length} missing permissions for role ID: ${id}`,
        RolesService.name
      );
    } else {
      LoggerService.log(`✅ No missing permissions for role ID: ${id}`, RolesService.name);
    }
    return {
      ...role,
      permissions: [...role.permissions, ...missingPermissions.map(p => ({ name: p }))],
    };
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
