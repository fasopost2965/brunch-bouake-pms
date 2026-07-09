import { Controller, Post, Body, UnauthorizedException, Request } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body() body: any) {
    if (!body.refresh_token) {
      throw new UnauthorizedException('Refresh token required');
    }
    return this.authService.refresh(body.refresh_token);
  }
}
