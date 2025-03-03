import { Controller, Post, Body, Req, UseGuards, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { AccessAuthGuard } from '@/access_control';
import { AuthThrottle, Public } from '@/access_control/access.decorator';
import { ChangePasswordDto } from '@/users/users.dto';
import { UsersService } from '@/users';

@AuthThrottle()
@Controller('auth')
@UseGuards(AccessAuthGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Public()
  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('register-superadmin')
  async registerSuperAdmin() {
    return this.authService.registerSuperAdmin();
  }

  @Post('logout')
  async logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @Post('logout-all')
  async logoutAll(@Req() req) {
    return this.authService.logoutAll(req.user.userId);
  }

  @Public()
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
