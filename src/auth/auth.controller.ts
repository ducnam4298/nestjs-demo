import { Controller, Post, Body } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

@SkipThrottle()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('login')
  async login(@Body() req) {
    return this.authService.login(req);
  }

  @Throttle({ short: { ttl: 1000, limit: 1 } })
  @Post('register')
  async register(@Body() req): Promise<any> {
    return this.authService.register(req.username, req.password);
  }
}
