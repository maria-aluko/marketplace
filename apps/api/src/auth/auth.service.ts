import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TermiiService } from './services/termii.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '@eventtrust/shared';
import {
  OTP_MAX_REQUESTS_PER_10_MIN,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
  OTP_BACKOFF_BASE_MS,
  REFRESH_TOKEN_EXPIRY_MS,
} from '@eventtrust/shared';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly termiiService: TermiiService,
    private readonly auditService: AuditService,
  ) {}

  async requestOtp(phone: string): Promise<{ message: string; expiresAt: Date }> {
    // Rate limit: max 3 OTP requests per phone in 10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await this.prisma.otpRequest.count({
      where: { phone, createdAt: { gte: tenMinAgo } },
    });

    if (recentCount >= OTP_MAX_REQUESTS_PER_10_MIN) {
      throw new HttpException('Too many OTP requests. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const code = this.generateOtpCode();
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.otpRequest.create({
      data: { phone, codeHash, expiresAt },
    });

    await this.termiiService.sendOtp(phone, code);

    return { message: 'OTP sent successfully', expiresAt };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ user: AuthUser; accessToken: string; refreshToken: string; csrfToken: string }> {
    const otpRequest = await this.prisma.otpRequest.findFirst({
      where: {
        phone,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRequest) {
      throw new UnauthorizedException('No valid OTP found. Please request a new one.');
    }

    if (otpRequest.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      throw new HttpException('Too many verification attempts. Please request a new OTP.', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Increment attempts
    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { attempts: { increment: 1 } },
    });

    const isValid = await argon2.verify(otpRequest.codeHash, code);

    if (!isValid) {
      // Exponential backoff delay
      const delay = OTP_BACKOFF_BASE_MS * Math.pow(2, otpRequest.attempts);
      await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 10000)));
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Mark OTP as verified
    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: { verified: true },
    });

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { phone } });

    if (!user) {
      user = await this.prisma.user.create({
        data: { phone },
      });
      await this.prisma.authIdentity.create({
        data: {
          userId: user.id,
          provider: 'PHONE',
          providerId: phone,
        },
      });
    }

    // Check for vendor
    const vendor = await this.prisma.vendor.findFirst({
      where: { userId: user.id, deletedAt: null },
    });

    const authUser: AuthUser = {
      id: user.id,
      phone: user.phone,
      role: user.role as any,
      vendorId: vendor?.id,
    };

    const tokens = await this.generateTokens(authUser);
    const csrfToken = crypto.randomBytes(32).toString('hex');

    await this.auditService.log({
      action: 'user.login',
      actorId: user.id,
      targetType: 'User',
      targetId: user.id,
    });

    return { user: authUser, ...tokens, csrfToken };
  }

  async refreshTokens(
    oldRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = this.hashToken(oldRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      // Token reuse detected — revoke entire family
      this.logger.warn(`Refresh token reuse detected for user ${storedToken.userId}`);
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Token reuse detected. All sessions revoked.');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Find vendor
    const vendor = await this.prisma.vendor.findFirst({
      where: { userId: storedToken.userId, deletedAt: null },
    });

    const authUser: AuthUser = {
      id: storedToken.user.id,
      phone: storedToken.user.phone,
      role: storedToken.user.role as any,
      vendorId: vendor?.id,
    };

    return this.generateTokens(authUser);
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { revokedAt: new Date() },
      });
    } else {
      // Revoke all tokens for user
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  async generateTokens(
    user: AuthUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      { sub: user.id, role: user.role, vendorId: user.vendorId },
      { expiresIn: '15m' },
    );

    const refreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return { accessToken, refreshToken };
  }

  async getUser(userId: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const vendor = await this.prisma.vendor.findFirst({
      where: { userId: user.id, deletedAt: null },
    });

    return {
      id: user.id,
      phone: user.phone,
      role: user.role as any,
      vendorId: vendor?.id,
    };
  }

  private generateOtpCode(): string {
    return String(crypto.randomInt(100000, 999999));
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
