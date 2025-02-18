import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategy/jwt-auth.guard';
// import { LoggerService } from '../logger';

@SkipThrottle()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}
  // private readonly logger = new LoggerService();

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('login')
  async login(
    @Body()
    { identifier, password, deviceId }: { identifier: string; password: string; deviceId: string }
  ) {
    return this.authService.login(identifier, password, deviceId);
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('logout')
  async logout(@Req() req, @Body('deviceId') deviceId: string) {
    return this.authService.logout(req.user.userId, deviceId);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('register')
  async register(@Body() req): Promise<any> {
    return this.authService.register(req.name, req.password, req.username, req.email, req.phone);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('register-superadmin')
  async registerSuperAdmin(): Promise<any> {
    return this.authService.registerSuperAdmin();
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('logout-all')
  async logoutAll(@Req() req) {
    return this.authService.logoutAll(req.user.userId);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('refresh')
  async refreshToken(
    @Body() { refreshToken, deviceId }: { refreshToken: string; deviceId: string }
  ) {
    return this.authService.refreshToken(refreshToken, deviceId);
  }
}
