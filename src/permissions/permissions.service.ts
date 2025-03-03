import { Injectable } from '@nestjs/common';
import { CreatePermissionDto, FindAllPermissionDto, UpdatePermissionDto } from './permissions.dto';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/logger';
@Injectable()
export class PermissionsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { name, entity, roleId } = createPermissionDto;
    LoggerService.log(`ℹ️ Creating permission: ${name}`, PermissionsService.name);
    try {
      const permission = await this.databaseService.permission.create({
        data: {
          name,
          entity,
          role: { connect: { id: roleId } },
        },
      });

      return permission;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error(`❌ Error creating permission: ${name}`, errorMessage);
      throw error;
    }
  }

  // Tìm tất cả permissions
  async findAll(findAllPermissionDto?: FindAllPermissionDto) {
    if (findAllPermissionDto) {
      LoggerService.log(`ℹ️ Finding permissions with filter`, PermissionsService.name);
      return await this.databaseService.permission.findMany({
        where: findAllPermissionDto,
      });
    }

    LoggerService.log(`ℹ️ Finding all permissions`, PermissionsService.name);
    return await this.databaseService.permission.findMany();
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    LoggerService.log(`ℹ️ Updating permission with ID: ${id}`, PermissionsService.name);

    try {
      const updatedPermission = await this.databaseService.permission.update({
        where: { id },
        data: updatePermissionDto,
      });

      return updatedPermission;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error(`❌ Error updating permission with ID: ${id}`, errorMessage);
      throw error;
    }
  }
}
