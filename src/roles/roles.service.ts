import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_PERMISSION } from '../shared/constants';
import { DatabaseService } from '../database/database.service';
import { AssignPermissionsForRole, CreateRoleDto, FindAllRoleDto } from './role.dto';

@Injectable()
export class RolesService {
  constructor(private databaseService: DatabaseService) {}

  async assignPermissionsForRole(assignPermissionsForRole: AssignPermissionsForRole) {
    const { id, permissionIds } = assignPermissionsForRole;
    const role = await this.databaseService.role.update({
      where: { id },
      data: {
        permissions: {
          connect: permissionIds.map(permissionId => ({
            id: permissionId,
          })),
        },
      },
    });

    return role;
  }

  async create(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;
    try {
      return this.databaseService.role.create({
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
    } catch (error) {
      throw new BadRequestException('Role creation failed');
    }
  }

  async findAll(findAllRoleDto?: FindAllRoleDto) {
    if (findAllRoleDto) {
      return this.databaseService.role.findMany({
        where: findAllRoleDto,
        include: { permissions: true },
      });
    }
    return this.databaseService.role.findMany({ include: { permissions: true } });
  }

  async findOne(id: string) {
    return this.databaseService.role.findUnique({ where: { id }, include: { permissions: true } });
  }

  async hasAllDefaultPermissions(id: string): Promise<boolean> {
    const role = await this.databaseService.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!role) return false;
    const existingPermissions = new Set(role.permissions.map(p => p.entity));
    return DEFAULT_PERMISSION.every(perm => existingPermissions.has(perm));
  }

  async updateRolePermissions(id: string) {
    const role = await this.databaseService.role.findUnique({
      where: { id },
      include: { permissions: true },
    });

    if (!role) {
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

    return this.databaseService.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
  }

  async remove(id: string) {
    return this.databaseService.role.delete({ where: { id } });
  }
}
