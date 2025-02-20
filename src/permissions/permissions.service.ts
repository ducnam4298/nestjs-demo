import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PermissionsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createPermissionDto: Prisma.PermissionCreateInput) {
    return await this.databaseService.permission.create({
      data: createPermissionDto,
    });
  }

  async findAll() {
    return await this.databaseService.permission.findMany();
  }

  async update(id: string, updatePermissionDto: Prisma.PermissionUpdateInput) {
    return await this.databaseService.permission.update({
      where: { id },
      data: updatePermissionDto,
    });
  }
}
