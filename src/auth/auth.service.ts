import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { StatusUser } from '@prisma/client';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { DatabaseService } from '@/database';
import { RolesService } from '@/roles';
import { LoggerService } from '@/services';
import { UsersService } from '@/users';
import { UpdateUserDto } from '@/users/users.dto';
import { maskEmail, retryTransaction } from '@/shared/utils';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rolesService: RolesService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, password, username, email, phone, roleId } = registerDto;
    LoggerService.log(
      `ℹ️ Registering user: ${username || maskEmail(email) || phone}`,
      AuthService.name
    );
    const hashedPassword = await this.passwordService.hashPassword(password);

    const identifier = username || email || phone;
    if (!identifier) {
      LoggerService.error('❌ Username, email, or phone is required', AuthService.name);
      throw new BadRequestException('Username, email, or phone is required');
    }

    const existingUser = await this.databaseService.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    const existingLogin = await this.databaseService.login.findFirst({
      where: { OR: [{ email }, { username }, { phone }] },
    });

    if (existingLogin || existingUser) {
      LoggerService.error(
        `❌ Email or ${existingLogin ? 'username or' : ''} phone number is already in use`,
        AuthService.name
      );
      throw new BadRequestException(
        `Email or ${existingLogin ? 'username or' : ''} phone number is already in use`
      );
    }

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
            roleId: role?.id ?? newRoleId,
            email,
            phone,
            login: { create: { email, username, phone, password: hashedPassword } },
          },
        })
      );
      LoggerService.log(`✅ User ${createdUser.id} registered successfully`, AuthService.name);
      return createdUser.id;
    }, AuthService.name);
    return id;
  }

  async registerSuperAdmin() {
    const hashedPassword = await this.passwordService.hashPassword('superadmin');
    const roleName = 'SUPER_ADMIN';
    const email = 'admin@gmail.com';
    LoggerService.log('ℹ️ Registering SuperAdmin', AuthService.name);

    const role = await this.databaseService.role.findUnique({ where: { name: roleName } });
    let newRoleId: string;
    if (!role) {
      newRoleId = await this.rolesService.create({ name: roleName });
      await this.rolesService.updateRolePermissions(newRoleId);
    } else {
      const hasAllPermissions = await this.rolesService.hasAllDefaultPermissions(role.id);
      if (!hasAllPermissions) {
        await this.rolesService.updateRolePermissions(role.id);
      }
    }

    const existingAdmin = await this.databaseService.user.findUnique({ where: { email } });

    const id = await retryTransaction<string>(async () => {
      return await this.databaseService.$transaction(async db => {
        if (existingAdmin) {
          LoggerService.warn('🚨 SuperAdmin already exists. Checking role...', AuthService.name);
          const updateData: UpdateUserDto = {};

          if (!existingAdmin.isActive) {
            updateData.isActive = true;
            updateData.status = StatusUser.ACTIVATED;
          }

          if (!role) updateData.roleId = newRoleId;
          else if (existingAdmin.roleId !== role.id) updateData.roleId = role.id;

          if (Object.keys(updateData).length > 0) {
            await db.user.update({
              where: { id: existingAdmin.id },
              data: updateData,
            });
            LoggerService.log(`✅ Updated SuperAdmin ${existingAdmin.id}`, AuthService.name);
          }
          return existingAdmin.id;
        }

        const createdUser = await db.user.create({
          data: {
            name: 'admin',
            email,
            phone: '0000000000',
            roleId: role ? role.id : newRoleId,
            isActive: true,
            status: StatusUser.ACTIVATED,
            login: {
              create: {
                username: 'admin',
                email,
                phone: '0000000000',
                password: hashedPassword,
              },
            },
          },
        });
        LoggerService.log(`✅ SuperAdmin created successfully`, AuthService.name);
        return createdUser.id;
      });
    }, AuthService.name);
    return id;
  }

  async login(loginDto: LoginDto) {
    const { identifier, password, deviceId } = loginDto;
    LoggerService.log(`ℹ️ User login attempt from device: ${deviceId}`, AuthService.name);

    const userLogin = await this.databaseService.login.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }, { username: identifier }] },
      include: { user: { include: { role: { include: { permissions: true } } } } },
    });

    if (!userLogin) {
      LoggerService.warn('🚨 Failed login attempt: User not found', AuthService.name);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      userLogin.password
    );
    if (!isPasswordValid) {
      LoggerService.warn('🚨 Failed login attempt: Incorrect password', AuthService.name);
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenService.generateTokens(userLogin.user, deviceId);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken, deviceId } = refreshTokenDto;
    LoggerService.log(`ℹ️ Refreshing token for device: ${deviceId}`, AuthService.name);
    return this.tokenService.refreshAccessToken(refreshToken, deviceId);
  }

  async logout(logoutDto: LogoutDto) {
    const { userId, deviceId } = logoutDto;
    LoggerService.log(`ℹ️ User ${userId} logging out from device ${deviceId}`, AuthService.name);
    await this.tokenService.invalidateToken(userId, deviceId);
    return { message: 'Logged out from this device' };
  }

  async logoutAll(userId: string) {
    LoggerService.log(`ℹ️ User ${userId} logging out from all devices`, AuthService.name);
    await this.tokenService.invalidateAllTokens(userId);
    return { message: 'Logged out from all devices' };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    return this.usersService.changePassword(userId, { oldPassword, newPassword });
  }
}
