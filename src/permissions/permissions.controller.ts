import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AccessAuthGuard } from '../auth/access_control/access-auth.guard';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto, UpdatePermissionDto } from './permissions.dto';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @UseGuards(AccessAuthGuard)
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @UseGuards(AccessAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }
}
