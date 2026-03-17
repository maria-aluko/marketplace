import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { TermiiService } from './services/termii.service';
import { AuditService } from '../audit/audit.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    otpRequest: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    authIdentity: {
      create: vi.fn(),
    },
    vendor: {
      findFirst: vi.fn(),
    },
    clientProfile: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  };

  const mockJwt = {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockConfig = {
    get: vi.fn().mockReturnValue('development'),
    getOrThrow: vi.fn().mockReturnValue('test-secret'),
  };

  const mockTermii = {
    sendOtp: vi.fn().mockResolvedValue(undefined),
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: TermiiService, useValue: mockTermii },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should send OTP successfully', async () => {
      mockPrisma.otpRequest.count.mockResolvedValue(0);
      mockPrisma.otpRequest.create.mockResolvedValue({ id: 'otp-1' });

      const result = await service.requestOtp('+2348012345678');

      expect(result.message).toBe('OTP sent successfully');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockTermii.sendOtp).toHaveBeenCalledWith('+2348012345678', expect.any(String));
    });

    it('should reject when rate limited (4th request)', async () => {
      mockPrisma.otpRequest.count.mockResolvedValue(3);

      await expect(service.requestOtp('+2348012345678')).rejects.toThrow(HttpException);
      await expect(service.requestOtp('+2348012345678')).rejects.toMatchObject({
        status: HttpStatus.TOO_MANY_REQUESTS,
      });
    });
  });

  describe('verifyOtp', () => {
    const mockUser = { id: 'user-1', phone: '+2348012345678', role: 'CLIENT' };

    it('should throw when no valid OTP found', async () => {
      mockPrisma.otpRequest.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp('+2348012345678', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw when max attempts exceeded', async () => {
      mockPrisma.otpRequest.findFirst.mockResolvedValue({
        id: 'otp-1',
        phone: '+2348012345678',
        codeHash: 'hash',
        attempts: 5,
        verified: false,
      });

      await expect(
        service.verifyOtp('+2348012345678', '123456'),
      ).rejects.toThrow(HttpException);
    });

    it('should throw on invalid code', async () => {
      // Use a real argon2 hash for a different code to test mismatch
      const argon2 = await import('argon2');
      const hash = await argon2.hash('654321');

      mockPrisma.otpRequest.findFirst.mockResolvedValue({
        id: 'otp-1',
        phone: '+2348012345678',
        codeHash: hash,
        attempts: 0,
        verified: false,
      });
      mockPrisma.otpRequest.update.mockResolvedValue({});

      await expect(
        service.verifyOtp('+2348012345678', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should verify OTP and return user + tokens', async () => {
      const argon2 = await import('argon2');
      const hash = await argon2.hash('123456');

      mockPrisma.otpRequest.findFirst.mockResolvedValue({
        id: 'otp-1',
        phone: '+2348012345678',
        codeHash: hash,
        attempts: 0,
        verified: false,
      });
      mockPrisma.otpRequest.update.mockResolvedValue({});
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.vendor.findFirst.mockResolvedValue(null);
      mockPrisma.clientProfile.findUnique.mockResolvedValue(null);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });

      const result = await service.verifyOtp('+2348012345678', '123456');

      expect(result.user.id).toBe('user-1');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.csrfToken).toBeDefined();
      expect(mockAudit.log).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should throw on invalid token', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should revoke entire family on token reuse', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', phone: '+2348012345678', role: 'CLIENT' },
      });

      await expect(service.refreshTokens('reused-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should issue new tokens on valid refresh', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'user-1', phone: '+2348012345678', role: 'CLIENT' },
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.vendor.findFirst.mockResolvedValue(null);
      mockPrisma.clientProfile.findUnique.mockResolvedValue(null);
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-2' });

      const result = await service.refreshTokens('valid-token');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should revoke specific refresh token', async () => {
      await service.logout('user-1', 'some-token');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should revoke all tokens when no specific token provided', async () => {
      await service.logout('user-1');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
