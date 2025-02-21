import { Controller, Post, Body, Req, UseGuards, Patch, Param } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AccessAuthGuard } from './access_control/access-auth.guard';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { ChangePasswordDto } from '../users/users.dto';
import { UsersService } from '../users';

@SkipThrottle()
@Controller('auth')
@UseGuards(AccessAuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @UseGuards()
  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @UseGuards()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @UseGuards()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @UseGuards()
  @Post('register-superadmin')
  async registerSuperAdmin() {
    return this.authService.registerSuperAdmin();
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('logout')
  async logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('logout-all')
  async logoutAll(@Req() req) {
    return this.authService.logoutAll(req.user.userId);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @UseGuards()
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
