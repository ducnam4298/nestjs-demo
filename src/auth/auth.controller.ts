import { Controller, Post, Body, Req, Patch, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './auth.dto';
import { Throttles, Metadata } from '@/access_control';

@Throttles.Auth()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Metadata.Public()
  @ApiOperation({ summary: 'Forgot user password' })
  @ApiBody({ type: ForgotPasswordDto })
  @Patch('forgotPassword')
  async forgotPassword(@Body() forgotPassword: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPassword.email);
  }

  @Metadata.Public()
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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

  @Metadata.Public()
  @ApiOperation({ summary: 'Reset password user' })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Metadata.Public()
  @ApiOperation({ summary: 'Verify email user' })
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
