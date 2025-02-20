import { Injectable, Param } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RolesService {
  constructor(private databaseService: DatabaseService) {}

  async create(name: string) {
    const defaultPermissions = await this.databaseService.permission.findMany();
    return this.databaseService.role.create({
      data: {
        name,
        permissions: {
          connect: defaultPermissions.map(per => ({ id: per.id })),
        },
      },
      include: { permissions: true },
    });
  }

  async assignPermissionsForRole(roleId: string, permissionIds: string[]) {
    const role = await this.databaseService.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          connect: permissionIds.map(permissionId => ({ id: permissionId })),
        },
      },
    });

    return role;
  }

  async findAll(name?: string) {
    return this.databaseService.role.findMany({ where: { name }, include: { permissions: true } });
  }

  async findOne(id: string) {
    return this.databaseService.role.findUnique({ where: { id }, include: { permissions: true } });
  }

  async remove(id: string) {
    return this.databaseService.role.delete({ where: { id } });
  }
}
