import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { AccessAuthGuard } from '../auth/access_control/access-auth.guard';
import { Permissions, Roles } from '../auth/access_control/access.decorator';
import { RolesService } from './roles.service';
import { AssignPermissionsForRole, CreateRoleDto, FindAllRoleDto } from './role.dto';

@UseGuards(AccessAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Roles('SUPER_ADMIN')
  @Permissions('CREATE')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('CREATE')
  @Post()
  assignPermissionsForRole(@Body() assignPermissionsForRole: AssignPermissionsForRole) {
    return this.rolesService.assignPermissionsForRole(assignPermissionsForRole);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('VIEWS')
  @Get()
  findAll(@Param('findAllRoleDto') findAllRoleDto?: FindAllRoleDto) {
    return this.rolesService.findAll(findAllRoleDto);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('DETAIL')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('UPDATE')
  @Patch(':id/permissions')
  async updateRolePermissions(@Param('id') id: string) {
    return this.rolesService.updateRolePermissions(id);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('DELETE')
  @Delete(':id')
  remove(@Param(':id') id: string) {
    return this.rolesService.remove(id);
  }
}
