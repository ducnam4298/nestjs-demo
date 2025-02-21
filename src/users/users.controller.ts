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
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { AccessAuthGuard } from '../auth/access_control/access-auth.guard';
import {
  ActivationDto,
  ChangePasswordDto,
  CreateUserDto,
  FindAllUserDto,
  UpdateStatusDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from './users.dto';

@SkipThrottle()
@Controller('users')
@UseGuards(AccessAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch(':id/activate')
  async activateUser(@Param('id') id: string, @Body() activationDto: ActivationDto) {
    return this.usersService.activate(id, activationDto);
  }

  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get()
  findAll(@Query() findAllUserDto: FindAllUserDto) {
    return this.usersService.findAll(findAllUserDto);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto) {
    return this.usersService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/role')
  async updateUserRole(@Param('id') id: string, @Body() updateUserRoleDto: UpdateUserRoleDto) {
    return this.usersService.updateUserRole(id, updateUserRoleDto);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
