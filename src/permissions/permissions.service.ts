import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePermissionDto, FindAllPermissionDto, UpdatePermissionDto } from './permissions.dto';

@Injectable()
export class PermissionsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const { name, entity, roleId } = createPermissionDto;
    return await this.databaseService.permission.create({
      data: {
        name,
        entity,
        role: { connect: { id: roleId } },
      },
    });
  }

  async findAll(findAllPermissionDto?: FindAllPermissionDto) {
    if (findAllPermissionDto) {
      return this.databaseService.permission.findMany({
        where: findAllPermissionDto,
      });
    }
    return await this.databaseService.permission.findMany();
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    return await this.databaseService.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }
}
