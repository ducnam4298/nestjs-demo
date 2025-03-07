import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, FindAllPermissionDto, UpdatePermissionDto } from './permissions.dto';
import { Metadata } from '@/access_control';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('CREATE')
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('VIEWS')
  @Get()
  findAll(@Query() findAllPermissionDto: FindAllPermissionDto) {
    return this.permissionsService.findAll(findAllPermissionDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }
}
