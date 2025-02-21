import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
import {
  ActivationDto,
  ChangePasswordDto,
  CreateUserDto,
  UpdateStatusDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async activate(id: string, activationDto: ActivationDto) {
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.databaseService.user.update({
      where: { id },
      data: { isActive: activationDto.activate },
    });
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
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

    const existingUser = await this.databaseService.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      throw new BadRequestException('Email or phone number is already in use');
    }

    return this.databaseService.user.create({
      data: {
        name,
        email,
        phone,
        roleId,
      },
    });
  }

  async findAll(query: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 10, search } = query;

    const users = await this.databaseService.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      skip,
      take,
    });

    return users;
  }

  async findOne(id: string) {
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { name, email, phone, roleId } = updateUserDto;

    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (email || phone) {
      const existingUser = await this.databaseService.user.findFirst({
        where: {
          OR: [{ email }, { phone }],
          NOT: { id },
        },
      });
      if (existingUser) {
        throw new BadRequestException('Email or phone number is already in use');
      }
    }

    return this.databaseService.user.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        roleId,
      },
    });
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.databaseService.user.update({
      where: { id },
      data: { status: updateStatusDto.status },
    });
  }

  async updateUserRole(id: string, updateUserRoleDto: UpdateUserRoleDto) {
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.databaseService.user.update({
      where: { id },
      data: { roleId: updateUserRoleDto.roleId },
    });
  }

  async remove(id: string) {
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return this.databaseService.user.delete({ where: { id } });
  }
}
