import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, LogoutDto, RefreshDto, RegisterDto } from './dto/auth.dto';
import { CurrentUser } from '../common/decorators/auth.decorators';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from '../common/utils/cookies';

type AuthResult = Awaited<ReturnType<AuthService['login']>>;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private issue(res: Response, result: AuthResult) {
    setAuthCookies(res, result, {
      access: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      refresh: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    // Tokens no corpo permanecem para clientes não-browser (app mobile).
    return result;
  }

  private refreshFrom(req: Request, bodyToken?: string): string | undefined {
    const cookies = (req as Request & { cookies?: Record<string, string> })
      .cookies;
    return bodyToken || cookies?.[REFRESH_COOKIE];
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.issue(res, await this.authService.register(dto));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.issue(res, await this.authService.login(dto));
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.refreshFrom(req, dto.refreshToken);
    if (!token) {
      clearAuthCookies(res);
      throw new UnauthorizedException('Refresh token ausente');
    }
    try {
      return this.issue(res, await this.authService.refresh(token));
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(200)
  @Post('logout')
  async logout(
    @CurrentUser() user: { userId: string },
    @Body() dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = this.refreshFrom(req, dto.refreshToken);
    clearAuthCookies(res);
    return this.authService.logout(user.userId, token);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@CurrentUser() user: { userId: string }) {
    return this.authService.me(user.userId);
  }
}
