import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
import { DatabaseService } from '@/database';
import { FilterService, LoggerService, PaginationService } from '@/services';
import { RolesService } from '@/roles';
import { PasswordService } from '@/auth';
import { maskEmail, retryTransaction } from '@/shared/utils';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rolesService: RolesService,
    private readonly passwordService: PasswordService,
    private readonly filterService: FilterService,
    private readonly paginationService: PaginationService
  ) {}

  async activate(id: string, activationDto: ActivationDto) {
    LoggerService.log(`ℹ️ Activating user with ID: ${id}`, UsersService.name);
    const user = await this.databaseService.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updatedUser = await this.databaseService.user.update({
      where: { id },
      data: { isActive: activationDto.activate },
    });
    LoggerService.log(`✅ User with ID: ${id} activation updated`, UsersService.name);
    return updatedUser;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;
    LoggerService.log(`ℹ️ Changing password for user with ID: ${id}`, UsersService.name);
    if (!oldPassword || !newPassword)
      throw new BadRequestException('Name, email, and phone are required');
    const user = await this.databaseService.user.findUnique({
      where: { id },
      include: { login: true },
    });
    if (!user || !user.login) throw new NotFoundException('User or login credentials not found');

    const passwordMatches = await this.passwordService.comparePassword(
      oldPassword,
      user.login.password
    );
    if (!passwordMatches) throw new BadRequestException('Old password is incorrect');

    const newHashedPassword = await this.passwordService.hashPassword(newPassword);
    const updatedLogin = await this.databaseService.login.update({
      where: { id: user.login.id },
      data: { password: newHashedPassword },
    });
    LoggerService.log(`✅ Password updated for user with ID: ${id}`, UsersService.name);
    return updatedLogin;
  }

  async create(createUserDto: CreateUserDto) {
    const { name, email, phone, roleId } = createUserDto;
    LoggerService.log(`ℹ️ Creating new user: ${maskEmail(email ?? '')}`, UsersService.name);
    if (!name || !email || !phone)
      throw new BadRequestException('Name, email, and phone are required');
    const hashedPassword = await this.passwordService.hashPassword('123123');

    const existingUser = await this.databaseService.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existingUser) throw new BadRequestException('Email or phone number is already in use');

    const id = await retryTransaction<string>(async () => {
      const role = roleId
        ? await this.rolesService.findOne(roleId)
        : await this.databaseService.role.findUnique({ where: { name: 'USER' } });
      let newRoleId: string = '';
      if (!role) newRoleId = await this.rolesService.create({ name: 'USER' });
      const createdUser = await this.databaseService.$transaction(async db =>
        db.user.create({
          data: {
            name,
            roleId: newRoleId,
            email,
            phone,
            login: { create: { email, phone, password: hashedPassword } },
          },
        })
      );
      LoggerService.log(`✅ User ${createdUser.id} created successfully`, UsersService.name);
      return createdUser.id;
    }, UsersService.name);

    return { id };
  }

  async findAll(findAllUserDto: FindAllUserDto) {
    const { page = 1, pageRecords = 10, sortBy, sortOrder, ...filters } = findAllUserDto;
    const model = 'user';
    LoggerService.log(
      `ℹ️ Finding users with filter: ${JSON.stringify(filters)}, page: ${page}, pageRecords: ${pageRecords}`,
      UsersService.name
    );
    const { sortBy: finalSortBy, sortOrder: finalSortOrder } =
      await this.filterService.getValidSortField(model, sortBy, sortOrder);

    return this.paginationService.paginate(
      model,
      filters,
      page,
      pageRecords,
      finalSortBy,
      finalSortOrder
    );
  }

  async findOne(id: string, findOneUserDto: FindOneUserDto) {
    const { email, phone } = findOneUserDto;
    LoggerService.log(`ℹ️ Finding user with ID: ${id}`, UsersService.name);
    let uniqueWhere: any = null;
    if (id) {
      uniqueWhere = { id };
    } else if (email) {
      uniqueWhere = { email };
    } else if (phone) {
      uniqueWhere = { phone };
    }
    if (!uniqueWhere) {
      throw new BadRequestException('No valid search criteria provided');
    }
    if (!Object.keys(uniqueWhere).length) {
      throw new BadRequestException('No valid search criteria provided');
    }
    const user = await this.databaseService.user.findUnique({
      where: uniqueWhere,
    });
    if (!user) throw new NotFoundException('User not found');
    LoggerService.log(`✅ User with ID: ${id} found`, UsersService.name);
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
    const updatedUser = await this.databaseService.user.update({
      where: { id },
      data: updateUserDto,
    });
    LoggerService.log(`✅ User with ID: ${id} updated successfully`, UsersService.name);
    return updatedUser;
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
    return this.databaseService.$transaction(async db => {
      const user = await db.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('User not found');
      await db.user.delete({ where: { id } });
      LoggerService.log(`✅ User with ID: ${id} removed successfully`, UsersService.name);
      return id;
    });
  }
}
