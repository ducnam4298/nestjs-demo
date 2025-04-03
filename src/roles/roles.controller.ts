import { Controller, Get, Post, Body, Param, Delete, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { AssignPermissionsForRole, CreateRoleDto, FindAllRoleDto } from './roles.dto';
import { ApiController, Metadata } from '@/access_control';

@ApiController('Roles', FindAllRoleDto)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiBody({ type: CreateRoleDto })
  @Post()
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiBody({ type: AssignPermissionsForRole })
  @Post('assign-permissions')
  async assignPermissionsForRole(@Body() assignPermissionsForRole: AssignPermissionsForRole) {
    return this.rolesService.assignPermissionsForRole(assignPermissionsForRole);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all roles' })
  @Get()
  async findAll(@Query() findAllRoleDto: FindAllRoleDto) {
    return this.rolesService.findAll(findAllRoleDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @Patch(':id/permissions')
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  async updateRolePermissions(@Param('id') id: string) {
    return this.rolesService.updateRolePermissions(id);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
