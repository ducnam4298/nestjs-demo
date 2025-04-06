import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, FindAllPermissionDto, UpdatePermissionDto } from './permissions.dto';
import { ApiController, Metadata } from '@/access_control';

@ApiController('Permissions', FindAllPermissionDto)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiBody({ type: CreatePermissionDto })
  @Post()
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Get all permissions' })
  @Get()
  async findAll(@Query() findAllPermissionDto: FindAllPermissionDto) {
    return this.permissionsService.findAll(findAllPermissionDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update a permission' })
  @ApiParam({ name: 'id', type: String, description: 'Permission ID' })
  @ApiBody({ type: UpdatePermissionDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }
}
