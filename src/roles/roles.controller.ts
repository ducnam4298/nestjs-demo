import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccessAuthGuard } from '../auth/access_control/access-auth.guard';
import { Permissions } from '../auth/access_control/access.decorator';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post()
  create(@Body('name') name: string) {
    return this.rolesService.create(name);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post()
  assignPermissionsForRole(
    @Body('roleId') roleId: string,
    @Body('permissionIds') permissionIds: string[]
  ) {
    return this.rolesService.assignPermissionsForRole(roleId, permissionIds);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get()
  findAll(@Param('name') name?: string) {
    return this.rolesService.findAll(name);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Delete(':id')
  remove(@Param(':id') id: string) {
    return this.rolesService.remove(id);
  }
}
