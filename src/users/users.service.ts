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
import { LoggerService } from '../logger';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async activate(id: string, activationDto: ActivationDto) {
    LoggerService.log(`ℹ️ Activating user with ID: ${id}`, UsersService.name);
    try {
      const user = await this.databaseService.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');
      return this.databaseService.user.update({
        where: { id },
        data: { isActive: activationDto.activate },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error activating user with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    LoggerService.log(`ℹ️ Changing password for user with ID: ${id}`, UsersService.name);

    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error changing password for user with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, phone, roleId } = createUserDto;
    LoggerService.log(`ℹ️ Creating new user: ${name} - ${email}`, UsersService.name);

    try {
      const existingUser = await this.databaseService.user.findFirst({
        where: { OR: [{ email }, { phone }] },
      });

      if (existingUser) {
        throw new BadRequestException('Email or phone number is already in use');
      }

      return await this.databaseService.user.create({
        data: {
          name,
          email,
          phone,
          roleId,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error creating user: ${email}`, errorMessage);
      throw error;
    }
  }

  async findAll(query: { skip?: number; take?: number; search?: string }) {
    const { skip = 0, take = 10, search } = query;
    LoggerService.log(`ℹ️ Finding users with filter: ${search || 'No filter'}`, UsersService.name);

    try {
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
        skip,
        take,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error finding users with filter: ${search}`, errorMessage);
      throw error;
    }
  }

  async findOne(id: string) {
    LoggerService.log(`ℹ️ Finding user with ID: ${id}`, UsersService.name);

    try {
      const user = await this.databaseService.user.findUnique({ where: { id } });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error finding user with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { name, email, phone, roleId } = updateUserDto;
    LoggerService.log(`ℹ️ Updating user with ID: ${id}`, UsersService.name);

    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error updating user with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  // Cập nhật trạng thái người dùng
  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    LoggerService.log(`ℹ️ Updating status for user with ID: ${id}`, UsersService.name);

    try {
      const user = await this.databaseService.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');
      return this.databaseService.user.update({
        where: { id },
        data: { status: updateStatusDto.status },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error updating status for user with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  async updateUserRole(id: string, updateUserRoleDto: UpdateUserRoleDto) {
    LoggerService.log(`ℹ️ Updating role for user with ID: ${id}`, UsersService.name);
    try {
      const user = await this.databaseService.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');
      return this.databaseService.user.update({
        where: { id },
        data: { roleId: updateUserRoleDto.roleId },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error updating role for user with ID: ${id}`, errorMessage);
      throw error;
    }
  }

  async remove(id: string) {
    LoggerService.log(`ℹ️ Removing user with ID: ${id}`, UsersService.name);
    try {
      const user = await this.databaseService.user.findUnique({ where: { id } });
      if (!user) {
        throw new BadRequestException('User not found');
      }
      return this.databaseService.user.delete({ where: { id } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.stack : String(error);
      LoggerService.error(`❌ Error removing user with ID: ${id}`, errorMessage);
      throw error;
    }
  }
}
