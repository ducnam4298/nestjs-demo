import { Controller, Post, Body, Req, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './auth.dto';
import { Throttles, Metadata } from '@/access_control';
import { ChangePasswordDto } from '@/users/users.dto';
import { UsersService } from '@/users';

@Throttles.Auth()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService
  ) {}

  @Metadata.Public()
  @ApiOperation({ summary: 'Change user password' })
  @ApiParam({ name: 'id', type: String, description: 'User ID' })
  @ApiBody({ type: ChangePasswordDto })
  @Patch(':id/password')
  async changePassword(@Param('id') id: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Metadata.Public()
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Metadata.Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Metadata.Public()
  @ApiOperation({ summary: 'Register a superadmin' })
  @Post('register-superadmin')
  async registerSuperAdmin() {
    return this.authService.registerSuperAdmin();
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiBody({ type: LogoutDto })
  @Post('logout')
  async logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @ApiOperation({ summary: 'Logout from all devices' })
  @Post('logout-all')
  async logoutAll(@Req() req) {
    return this.authService.logoutAll(req.user.userId);
  }

  @Metadata.Public()
  @ApiOperation({ summary: 'Refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
