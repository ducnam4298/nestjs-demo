import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  ActivationDto,
  ChangePasswordDto,
  CreateUserDto,
  FindAllUserDto,
  FindOneUserDto,
  UpdateStatusDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from './users.dto';
import { ApiController, Metadata } from '@/access_control';

@ApiController('Users', FindAllUserDto)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Activate a user account' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ type: ActivationDto })
  @Patch(':id/activate')
  async activateUser(@Param('id') id: string, @Body() activationDto: ActivationDto) {
    return this.usersService.activate(id, activationDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Change user password' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ type: ChangePasswordDto })
  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('CREATE')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('VIEWS')
  @ApiOperation({ summary: 'Find all users' })
  @Get()
  async findAll(@Query() findAllUserDto: FindAllUserDto) {
    return this.usersService.findAll(findAllUserDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('DETAIL')
  @ApiOperation({ summary: 'Find a user by ID' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Query() findOneUserDto: FindOneUserDto) {
    return this.usersService.findOne(id, findOneUserDto);
  }

  @Metadata.Roles('SUPER_ADMIN', 'USER')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ type: UpdateUserDto })
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update user status' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ type: UpdateStatusDto })
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('UPDATE')
  @ApiOperation({ summary: 'Update user role' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ type: UpdateUserRoleDto })
  @Patch(':id/role')
  async updateUserRole(@Param('id') id: string, @Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.usersService.updateUserRole(id, updateUserRoleDto);
  }

  @Metadata.Roles('SUPER_ADMIN')
  @Metadata.Permissions('DELETE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
