import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermissionDto, FindAllPermissionDto, UpdatePermissionDto } from './permissions.dto';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/logger';
import { getValidSortField, retryTransaction } from '@/shared/utils';

@Injectable()
export class PermissionsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { name, entity, roleId } = createPermissionDto;
    LoggerService.log(
      `ℹ️ Creating permission: ${name} for entity: ${entity}`,
      PermissionsService.name
    );
    if (!name || !entity || !roleId)
      throw new BadRequestException('Name, entity, and roleId are required');
    const id = await retryTransaction<string>(async () => {
      const newPermission = await this.databaseService.$transaction(async db => {
        const roleExists = await db.role.findUnique({ where: { id: roleId } });
        if (!roleExists) {
          LoggerService.warn(`🚨 Role with ID ${roleId} not found`, PermissionsService.name);
          throw new NotFoundException(`Role with ID ${roleId} not found`);
        }

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
    const { skip, take, sortBy, sortOrder, ...filters } = findAllPermissionDto;
    LoggerService.log(
      `ℹ️ Finding permissions with filters: ${JSON.stringify(filters)}, skip: ${skip}, take: ${take}`,
      PermissionsService.name
    );

    const hasUpdated = await this.databaseService.permission.findFirst({
      where: { updatedAt: { not: null } },
      select: { updatedAt: true },
    });
    const { sortBy: finalSortBy, sortOrder: finalSortOrder } = await getValidSortField(
      'permission',
      sortBy,
      sortOrder,
      !!hasUpdated
    );

    const permissions = await this.databaseService.permission.findMany({
      where: Object.keys(filters).length ? filters : undefined,
      skip,
      take,
      orderBy: finalSortBy ? { [finalSortBy]: finalSortOrder } : undefined,
    });
    LoggerService.log(`✅ Found ${permissions.length} permissions`, PermissionsService.name);
    return permissions;
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    LoggerService.log(`ℹ️ Updating permission with ID: ${id}`, PermissionsService.name);
    return this.databaseService.$transaction(async db => {
      const existingPermission = await db.permission.findUnique({ where: { id } });
      if (!existingPermission) {
        LoggerService.warn(`🚨 Permission not found with ID: ${id}`, PermissionsService.name);
        throw new NotFoundException('Permission not found');
      }

      const updatedPermission = await db.permission.update({
        where: { id },
        data: updatePermissionDto,
      });
      LoggerService.log(
        `✅ Permission updated successfully: ${updatedPermission.id}`,
        PermissionsService.name
      );
      return updatedPermission;
    });
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
