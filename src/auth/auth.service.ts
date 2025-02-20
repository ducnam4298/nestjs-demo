import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RolesService } from '../roles';
import { LoggerService } from '../logger';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rolesService: RolesService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, password, username, email, phone, roleId } = registerDto;
    LoggerService.log(`Registering user: ${username || email || phone}`, AuthService.name);
    const hashedPassword = await this.passwordService.hashPassword(password);

    const identifier = username || email || phone;
    if (!identifier) throw new BadRequestException('Username, email, or phone is required');

    const existingUser = await this.databaseService.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email or phone number is already in use');
    }

    let role = roleId
      ? await this.databaseService.role.findUnique({ where: { id: roleId } })
      : await this.databaseService.role.findUnique({ where: { name: 'USER' } });

    if (!role) {
      role = await this.rolesService.create({ name: 'USER' });
    }

    const newUser = await this.databaseService.user.create({
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

    return { message: 'Registration successful', userId: newUser.id };
  }

  async registerSuperAdmin() {
    const hashedPassword = await this.passwordService.hashPassword('superadmin');
    const roleName = 'SUPER_ADMIN';
    const email = 'admin@gmail.com';
    LoggerService.log('Registering SuperAdmin', AuthService.name);

    let role = await this.databaseService.role.findUnique({
      where: { name: roleName },
      include: { permissions: true },
    });

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

    if (existingAdmin) {
      LoggerService.warn('SuperAdmin already exists. Checking role...', AuthService.name);
      if (existingAdmin.roleId !== role.id) {
        await this.databaseService.user.update({
          where: { id: existingAdmin.id },
          data: { roleId: role.id },
        });
        return { message: 'SuperAdmin role updated successfully', user: existingAdmin };
      }
      return { message: 'SuperAdmin already has the correct role', user: existingAdmin };
    }

    const newUser = await this.databaseService.user.create({
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

    return { message: 'SuperAdmin created successfully', user: newUser };
  }

  async login(loginDto: LoginDto) {
    const { identifier, password, deviceId } = loginDto;
    LoggerService.log(
      `User login attempt: ${identifier} from device: ${deviceId}`,
      AuthService.name
    );

    const userLogin = await this.databaseService.login.findFirst({
      where: { OR: [{ email: identifier }, { phone: identifier }, { username: identifier }] },
      include: { user: { include: { role: { include: { permissions: true } } } } },
    });

    if (!userLogin || !(await this.passwordService.comparePassword(password, userLogin.password))) {
      LoggerService.warn(`Failed login attempt: ${identifier}`, AuthService.name);
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenService.generateTokens(userLogin.user, deviceId);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken, deviceId } = refreshTokenDto;
    LoggerService.log(`Refreshing token for device: ${deviceId}`, AuthService.name);
    return this.tokenService.refreshAccessToken(refreshToken, deviceId);
  }

  async logout(logoutDto: LogoutDto) {
    const { userId, deviceId } = logoutDto;
    LoggerService.log(`User ${userId} logging out from device ${deviceId}`, AuthService.name);
    await this.tokenService.invalidateToken(userId, deviceId);
    return { message: 'Logged out from this device' };
  }

  async logoutAll(userId: string) {
    LoggerService.log(`User ${userId} logging out from all devices`, AuthService.name);
    await this.tokenService.invalidateAllTokens(userId);
    return { message: 'Logged out from all devices' };
  }
}
