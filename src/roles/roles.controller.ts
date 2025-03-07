import { Controller, Get, Post, Body, Param, Delete, Patch, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AssignPermissionsForRole, CreateRoleDto, FindAllRoleDto } from './roles.dto';
import { Metadata } from '@/access_control';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @Post()
  assignPermissionsForRole(@Body() assignPermissionsForRole: AssignPermissionsForRole) {
    return this.rolesService.assignPermissionsForRole(assignPermissionsForRole);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('VIEWS')
  @Get()
  findAll(@Query() findAllRoleDto: FindAllRoleDto) {
    return this.rolesService.findAll(findAllRoleDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DETAIL')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @Patch(':id/permissions')
  async updateRolePermissions(@Param('id') id: string) {
    return this.rolesService.updateRolePermissions(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @Delete(':id')
  remove(@Param(':id') id: string) {
    return this.rolesService.remove(id);
  }
}
