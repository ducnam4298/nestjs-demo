import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto, FindAllPermissionDto, UpdatePermissionDto } from './permissions.dto';
import { DatabaseService } from '@/database';
import { RolesService } from '@/roles';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { retryTransaction } from '@/shared';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly roleService: RolesService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { name, entity, roleId } = createPermissionDto;
    LoggerService.log(
      `ℹ️ Creating permission: ${name} for entity: ${entity}`,
      PermissionsService.name
    );
    if (!name || !entity || !roleId)
      throw new BadRequestException('Name, entity, and roleId are required');
    const roleExists = await this.roleService.findOne(roleId);
    if (!roleExists) {
      LoggerService.warn(`🚨 Role with ID ${roleId} not found`, PermissionsService.name);
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }
    const id = await retryTransaction<string>(async () => {
      const newPermission = await this.databaseService.$transaction(async db => {
        const existingPermission = await db.permission.findFirst({
          where: { name, entity, roleId },
        });
        if (existingPermission) {
          LoggerService.warn(
            `🚨 Permission ${name} for entity ${entity} already exists`,
            PermissionsService.name
          );
          return existingPermission;
        }
        return await db.permission.create({ data: { name, entity, roleId } });
      });
      LoggerService.log(
        `✅ Permission ${newPermission.id} created successfully`,
        PermissionsService.name
      );
      return newPermission.id;
    }, PermissionsService.name);
    return id;
  }

  async findAll(findAllPermissionDto: FindAllPermissionDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllPermissionDto;
    const model = 'permission';
    LoggerService.log(
      `ℹ️ Finding permissions with filters: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      PermissionsService.name
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

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    LoggerService.log(`ℹ️ Updating permission with ID: ${id}`, PermissionsService.name);
    const existingPermission = await this.databaseService.permission.findUnique({ where: { id } });
    if (!existingPermission) {
      LoggerService.warn(`🚨 Permission not found with ID: ${id}`, PermissionsService.name);
      throw new NotFoundException('Permission not found');
    }

    const updatedPermission = await this.databaseService.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
    LoggerService.log(
      `✅ Permission updated successfully: ${updatedPermission.id}`,
      PermissionsService.name
    );
    return updatedPermission;
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing permission with ID: ${id}`, PermissionsService.name);
    return this.databaseService.$transaction(async db => {
      const existingPermission = await db.permission.findUnique({ where: { id } });
      if (!existingPermission) {
        LoggerService.warn(`🚨 Permission not found with ID: ${id}`, PermissionsService.name);
        throw new NotFoundException('Permission not found');
      }
      await db.permission.delete({ where: { id } });
      LoggerService.log(`✅ Permission removed successfully: ${id}`, PermissionsService.name);
      return id;
    });
  }
}
