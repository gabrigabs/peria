import { Controller, Post, Body, Get, Headers, UnauthorizedException } from '@nestjs/common'
import { AuthService, LoginResponse, TokenPayload } from './auth.service'

/**
 * Auth controller - handles authentication endpoints
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login endpoint
   */
  @Post('login')
  async login(@Body() body: { email: string; password: string }): Promise<LoginResponse> {
    return this.authService.login(body.email, body.password)
  }

  /**
   * Logout endpoint
   */
  @Post('logout')
  async logout(@Headers('authorization') auth: string): Promise<{ success: boolean }> {
    const token = auth?.replace('Bearer ', '')
    if (!token) {
      throw new UnauthorizedException('No token provided')
    }
    return this.authService.logout(token)
  }

  /**
   * Verify token endpoint
   */
  @Get('verify')
  verify(@Headers('authorization') auth: string): TokenPayload {
    const token = auth?.replace('Bearer ', '')
    if (!token) {
      throw new UnauthorizedException('No token provided')
    }
    return this.authService.verifyToken(token)
  }

  /**
   * Refresh token endpoint
   */
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }): Promise<LoginResponse> {
    return this.authService.refreshToken(body.refreshToken)
  }
}
