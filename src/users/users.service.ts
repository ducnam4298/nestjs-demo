import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import {
  ActivationDto,
  ChangePasswordDto,
  CreateUserDto,
  UpdateStatusDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from './users.dto';
import { DatabaseService } from '@/database';
import { LoggerService } from '@/logger';
import { RolesService } from '@/roles';
import { PasswordService } from '@/auth';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rolesService: RolesService,
    private readonly passwordService: PasswordService
  ) {}

  async activate(id: string, activationDto: ActivationDto) {
    LoggerService.log(`ℹ️ Activating user with ID: ${id}`, UsersService.name);
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.databaseService.user.update({
      where: { id },
      data: { isActive: activationDto.activate },
    });
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    LoggerService.log(`ℹ️ Changing password for user with ID: ${id}`, UsersService.name);
    const user = await this.databaseService.user.findUnique({
      where: { id },
      include: { login: true },
    });
    if (!user || !user.login) throw new NotFoundException('User or login credentials not found');

    const passwordMatches = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.login.password
    );
    if (!passwordMatches) throw new BadRequestException('Old password is incorrect');

    const newPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    return this.databaseService.login.update({
      where: { id: user.login.id },
      data: { password: newPassword },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, phone, roleId } = createUserDto;
    LoggerService.log(`ℹ️ Creating new user: ${email}`, UsersService.name);
    const hashedPassword = await this.passwordService.hashPassword('123123');
    const existingUser = await this.databaseService.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) throw new BadRequestException('Email or phone number is already in use');
    const id = await this.databaseService.$transaction(async db => {
      let role = roleId
        ? await db.role.findUnique({ where: { id: roleId } })
        : await db.role.findUnique({ where: { name: 'USER' } });

      if (!role) role = await this.rolesService.create({ name: 'USER' });
      const createdUser = await db.user.create({
        data: {
          name,
          roleId: role.id,
          email,
          phone,
          login: {
            create: { email, phone, password: hashedPassword },
          },
        },
      });
      LoggerService.log(`✅ User ${createdUser.id} created successfully`, UsersService.name);
      return createdUser.id;
    });
    return { id };
  }

  async findAll(query: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 10, search } = query;
    LoggerService.log(`ℹ️ Finding users with filter: ${search || 'No filter'}`, UsersService.name);
    return this.databaseService.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      skip: skip || 0,
      take: take || 10,
    });
  }

  async findOne(id: string) {
    LoggerService.log(`ℹ️ Finding user with ID: ${id}`, UsersService.name);
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { email, phone } = updateUserDto;
    LoggerService.log(`ℹ️ Updating user with ID: ${id}`, UsersService.name);
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (email || phone) {
      const existingUser = await this.databaseService.user.findFirst({
        where: {
          OR: [{ email }, { phone }],
          NOT: { id },
        },
      });
      if (existingUser) throw new BadRequestException('Email or phone number is already in use');
    }
    return this.databaseService.user.update({ where: { id }, data: updateUserDto });
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    LoggerService.log(`ℹ️ Updating status for user with ID: ${id}`, UsersService.name);
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.databaseService.user.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });
  }

  async updateUserRole(id: string, updateUserRoleDto: UpdateUserRoleDto) {
    LoggerService.log(`ℹ️ Updating role for user with ID: ${id}`, UsersService.name);
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.databaseService.user.update({
      where: { id },
      data: { roleId: updateUserRoleDto.roleId },
    });
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing user with ID: ${id}`, UsersService.name);
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.databaseService.user.delete({ where: { id } });
  }
}
