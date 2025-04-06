import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { DatabaseService } from '@/database';
import { RolesService } from '@/roles';
import { LoggerService } from '@/services';
import { UsersService, UpdateUserDto } from '@/users';
import {
  maskEmail,
  retryTransaction,
  isValidEmail,
  isValidPhoneNumber,
  StatusUser,
} from '@/shared';

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
      `ℹ️ Registering user: ${username || maskEmail(email ?? '') || phone}`,
      AuthService.name
    );
    if (!username || !email || !phone) {
      throw new BadRequestException('Username, email, or phone is required');
    }
    if (email && !isValidEmail(email)) {
      throw new BadRequestException('Invalid email format');
    }
    if (phone && !isValidPhoneNumber(phone)) {
      throw new BadRequestException('Invalid phone number');
    }

    const hashedPassword = password && (await this.passwordService.hashPassword(password));

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

    return retryTransaction(async () => {
      const newRoleId = roleId || (await this.rolesService.ensureRoleExists('USER'));
      const createdUser = await this.databaseService.user.create({
        data: {
          name: name || '',
          roleId: newRoleId,
          email,
          phone,
          login: { create: { email, username, phone, password: hashedPassword } },
        },
      });
      LoggerService.log(`✅ User ${createdUser.id} registered successfully`, AuthService.name);
      return createdUser.id;
    }, AuthService.name);
  }

  async registerSuperAdmin() {
    const hashedPassword = await this.passwordService.hashPassword('superadmin');
    const email = 'admin@gmail.com';
    LoggerService.log('ℹ️ Registering SuperAdmin', AuthService.name);

    const roleId = await this.rolesService.ensureRoleExists('SUPER_ADMIN');

    return retryTransaction(async () => {
      return this.databaseService.$transaction(async db => {
        const existingAdmin = await db.user.findUnique({ where: { email } });
        if (existingAdmin) {
          LoggerService.warn('🚨 SuperAdmin already exists. Checking role...', AuthService.name);
          const updateData: Partial<UpdateUserDto> = {};

          if (!existingAdmin.isActive) {
            updateData.isActive = true;
            updateData.status = StatusUser.ACTIVATED;
          }

          if (existingAdmin.roleId !== roleId) updateData.roleId = roleId;

          if (Object.keys(updateData).length > 0) {
            await db.user.update({
              where: { id: existingAdmin.id },
              data: updateData,
            });
            await db.login.update({
              where: { userId: existingAdmin.id },
              data: { password: hashedPassword },
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
            roleId,
            isActive: true,
            status: StatusUser.ACTIVATED,
            login: {
              create: { username: 'admin', email, phone: '0000000000', password: hashedPassword },
            },
          },
        });
        LoggerService.log(`✅ SuperAdmin created successfully`, AuthService.name);
        return createdUser.id;
      });
    }, AuthService.name);
  }

  async login(loginDto: LoginDto) {
    const { identifier, password, deviceId } = loginDto;
    LoggerService.log(`ℹ️ User login attempt from device: ${deviceId}`, AuthService.name);

    const userLogin = await this.databaseService.login.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }, { username: identifier }] },
    });

    if (!userLogin || !(await this.passwordService.comparePassword(password, userLogin.password))) {
      LoggerService.warn(
        '🚨 Failed login attempt: User not found or Incorrect password',
        AuthService.name
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenService.generateTokens(userLogin.userId, deviceId);
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
