import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccessAuthGuard } from '../auth/access_control/access-auth.guard';
import { Permissions } from '../auth/access_control/access.decorator';
import { RolesService } from './roles.service';
import { AssignPermissionsForRole, CreateRoleDto, FindAllRoleDto } from './role.dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post()
  assignPermissionsForRole(@Body() assignPermissionsForRole: AssignPermissionsForRole) {
    return this.rolesService.assignPermissionsForRole(assignPermissionsForRole);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get()
  findAll(@Param('findAllRoleDto') findAllRoleDto?: FindAllRoleDto) {
    return this.rolesService.findAll(findAllRoleDto);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Patch(':id/permissions')
  async updateRolePermissions(@Param('id') id: string) {
    return this.rolesService.updateRolePermissions(id);
  }

  @UseGuards(AccessAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Delete(':id')
  remove(@Param(':id') id: string) {
    return this.rolesService.remove(id);
  }
}
