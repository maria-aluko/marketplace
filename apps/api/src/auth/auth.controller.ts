import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  otpRequestSchema,
  otpVerifySchema,
  CSRF_COOKIE_NAME,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '@eventtrust/shared';
import type { OtpRequestPayload, OtpVerifyPayload, AccessTokenPayload } from '@eventtrust/shared';

const COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(otpRequestSchema))
  async requestOtp(@Body() body: OtpRequestPayload) {
    const result = await this.authService.requestOtp(body.phone);
    return { message: result.message, expiresAt: result.expiresAt.toISOString() };
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema)) body: OtpVerifyPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(body.phone, body.code);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
      ...COOKIE_BASE,
      secure: isProduction,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...COOKIE_BASE,
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie(CSRF_COOKIE_NAME, result.csrfToken, {
      httpOnly: false,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user: result.user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
      ...COOKIE_BASE,
      secure: isProduction,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      ...COOKIE_BASE,
      secure: isProduction,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Tokens refreshed' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AccessTokenPayload,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(user.sub, refreshToken);

    res.clearCookie(ACCESS_COOKIE_NAME);
    res.clearCookie(REFRESH_COOKIE_NAME);
    res.clearCookie(CSRF_COOKIE_NAME);

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  async me(@CurrentUser() user: AccessTokenPayload) {
    const fullUser = await this.authService.getUser(user.sub);
    return { user: fullUser };
  }

  @Public()
  @Get('csrf-token')
  csrfToken(@Res({ passthrough: true }) res: Response) {
    const token = crypto.randomBytes(32).toString('hex');
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { csrfToken: token };
  }
}
