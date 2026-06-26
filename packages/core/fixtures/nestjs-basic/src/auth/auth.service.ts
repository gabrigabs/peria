import { Injectable, UnauthorizedException } from '@nestjs/common';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  private tokens: Map<string, TokenPayload> = new Map();

  async login(email: string, password: string): Promise<LoginResponse> {
    // Simplified auth logic for fixture
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateToken(email);
    const refreshToken = this.generateToken(email, true);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  async logout(token: string): Promise<{ success: boolean }> {
    this.tokens.delete(token);
    return { success: true };
  }

  verifyToken(token: string): TokenPayload {
    const payload = this.tokens.get(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const payload = this.verifyToken(refreshToken);
    return this.login(payload.email, '');
  }

  private generateToken(email: string, isRefresh = false): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (isRefresh ? 86400 : 3600);

    const payload: TokenPayload = {
      sub: Math.random().toString(36).substring(7),
      email,
      iat: now,
      exp,
    };

    const token = `token_${payload.sub}_${isRefresh ? 'refresh' : 'access'}`;
    this.tokens.set(token, payload);

    return token;
  }
}
