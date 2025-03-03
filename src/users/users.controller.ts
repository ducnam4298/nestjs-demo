import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ActivationDto,
  ChangePasswordDto,
  CreateUserDto,
  FindAllUserDto,
  UpdateStatusDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from './users.dto';
import { Permissions, Roles } from '@/access_control/access.decorator';
import { AccessAuthGuard } from '@/access_control';

@Controller('users')
@UseGuards(AccessAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('SUPER_ADMIN')
  @Permissions('UPDATE')
  @Patch(':id/activate')
  async activateUser(@Param('id') id: string, @Body() activationDto: ActivationDto) {
    return this.usersService.activate(id, activationDto);
  }

  @Roles('SUPER_ADMIN', 'USER')
  @Permissions('UPDATE')
  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Roles('SUPER_ADMIN', 'USER')
  @Permissions('CREATE')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles('SUPER_ADMIN', 'USER')
  @Permissions('VIEWS')
  @Get()
  findAll(@Query() findAllUserDto: FindAllUserDto) {
    return this.usersService.findAll(findAllUserDto);
  }

  @Roles('SUPER_ADMIN', 'USER')
  @Permissions('DETAIL')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles('SUPER_ADMIN', 'USER')
  @Permissions('UPDATE')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('UPDATE')
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }

  @Roles('SUPER_ADMIN')
  @Permissions('UPDATE')
  @Patch(':id/role')
  async updateUserRole(@Param('id') id: string, @Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.usersService.updateUserRole(id, updateUserRoleDto);
  }
  @Roles('SUPER_ADMIN')
  @Permissions('DELETE')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
