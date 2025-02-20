import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Prisma } from '@prisma/client';
import { AccessAuthGuard } from '../auth/access_control/access-auth.guard';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post()
  create(@Body() createPermissionDto: Prisma.PermissionCreateInput) {
    return this.permissionsService.create(createPermissionDto);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: Prisma.PermissionUpdateInput) {
    return this.permissionsService.update(id, updateUserDto);
  }
}
