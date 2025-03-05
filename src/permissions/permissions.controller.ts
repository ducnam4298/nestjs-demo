import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './permissions.dto';
import { Roles, Permissions } from '@/access_control/access.decorator';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Roles('SUPER_ADMIN')
  @Permissions('CREATE')
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('VIEWS')
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Roles('SUPER_ADMIN')
  @Permissions('UPDATE')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }
}
