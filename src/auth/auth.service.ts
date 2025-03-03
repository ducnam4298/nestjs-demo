import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RolesService } from '../roles';
import { LoggerService } from '../logger';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { UsersService } from '../users/users.service';

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
    LoggerService.log(`ℹ️ Registering user: ${username || email || phone}`, AuthService.name);
    const hashedPassword = await this.passwordService.hashPassword(password);

    const identifier = username || email || phone;
    if (!identifier) {
      LoggerService.error('❌ Username, email, or phone is required', AuthService.name);
      throw new BadRequestException('Username, email, or phone is required');
    }

    try {
      const existingUser = await this.databaseService.user.findFirst({
        where: {
          OR: [{ email }, { phone }],
        },
      });

      if (existingUser) {
        LoggerService.error('❌ Email or phone number is already in use', AuthService.name);
        throw new BadRequestException('Email or phone number is already in use');
      }

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
              create: { username, email, phone, password: hashedPassword },
            },
          },
        });
        LoggerService.log(`✅ User ${createdUser.id} registered successfully`, AuthService.name);
        return createdUser.id;
      });

      return { id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error('❌ Registration failed', errorMessage);
      throw error;
    }
  }

  async registerSuperAdmin() {
    const hashedPassword = await this.passwordService.hashPassword('superadmin');
    const roleName = 'SUPER_ADMIN';
    const email = 'admin@gmail.com';
    LoggerService.log('ℹ️ Registering SuperAdmin', AuthService.name);

    try {
      let role = await this.databaseService.role.findUnique({ where: { name: roleName } });

      if (!role) {
        role = await this.rolesService.create({ name: roleName });
        await this.rolesService.updateRolePermissions(role.id);
      } else {
        const hasAllPermissions = await this.rolesService.hasAllDefaultPermissions(role.id);
        if (!hasAllPermissions) {
          await this.rolesService.updateRolePermissions(role.id);
        }
      }

      const existingAdmin = await this.databaseService.user.findUnique({ where: { email } });

      const id = await this.databaseService.$transaction(async db => {
        if (existingAdmin) {
          LoggerService.warn('🚨 SuperAdmin already exists. Checking role...', AuthService.name);
          if (existingAdmin.roleId !== role.id) {
            await db.user.update({
              where: { id: existingAdmin.id },
              data: { roleId: role.id },
            });
            LoggerService.log(
              `✅ Role updated for SuperAdmin ${existingAdmin.id}`,
              AuthService.name
            );
            return existingAdmin.id;
          }
          return existingAdmin.id;
        }

        const createdUser = await db.user.create({
          data: {
            name: 'admin',
            email,
            phone: '0000000000',
            roleId: role.id,
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
        LoggerService.log(`✅ SuperAdmin ${createdUser.id} created successfully`, AuthService.name);
        return createdUser.id;
      });

      return { id };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error('❌ SuperAdmin registration failed', errorMessage);
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const { identifier, password, deviceId } = loginDto;
    LoggerService.log(
      `ℹ️ User login attempt: ${identifier} from device: ${deviceId}`,
      AuthService.name
    );

    try {
      const userLogin = await this.databaseService.login.findFirst({
        where: { OR: [{ email: identifier }, { phone: identifier }, { username: identifier }] },
        include: { user: { include: { role: { include: { permissions: true } } } } },
      });

      if (
        !userLogin ||
        !(await this.passwordService.comparePassword(password, userLogin.password))
      ) {
        LoggerService.warn(`🚨 Failed login attempt: ${identifier}`, AuthService.name);
        throw new UnauthorizedException('Invalid credentials');
      }

      return this.tokenService.generateTokens(userLogin.user, deviceId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      LoggerService.error('❌ Login failed', errorMessage);
      throw error;
    }
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
