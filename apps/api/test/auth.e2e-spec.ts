import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { TermiiService } from '../src/auth/services/termii.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  CSRF_HEADER_NAME,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  CSRF_COOKIE_NAME,
} from '@eventtrust/shared';

const TEST_PHONE = '+2349900000001';
const TEST_PHONE_2 = '+2349900000002';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let capturedOtp = '';

  const mockTermii = {
    sendOtp: vi.fn().mockImplementation(async (_phone: string, code: string) => {
      capturedOtp = code;
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TermiiService)
      .useValue(mockTermii)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await cleanupTestData([TEST_PHONE, TEST_PHONE_2]);
  });

  afterAll(async () => {
    await cleanupTestData([TEST_PHONE, TEST_PHONE_2]);
    await app.close();
  });

  async function cleanupTestData(phones: string[]) {
    await prisma.otpRequest.deleteMany({ where: { phone: { in: phones } } });
    const users = await prisma.user.findMany({ where: { phone: { in: phones } } });
    if (users.length > 0) {
      const ids = users.map((u) => u.id);
      await prisma.adminLog.deleteMany({ where: { adminId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  }

  async function requestOtp(phone: string): Promise<string> {
    capturedOtp = '';
    mockTermii.sendOtp.mockClear();
    await request(app.getHttpServer())
      .post('/auth/otp/request')
      .send({ phone })
      .expect(200);
    return capturedOtp;
  }

  async function login(phone: string): Promise<{ cookieHeader: string; csrfToken: string }> {
    const code = await requestOtp(phone);
    const res = await request(app.getHttpServer())
      .post('/auth/otp/verify')
      .send({ phone, code })
      .expect(200);
    const setCookies = res.headers['set-cookie'] as string[];
    const cookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');
    const csrfEntry = setCookies.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`)) ?? '';
    const csrfToken = csrfEntry.split('=')[1]?.split(';')[0] ?? '';
    return { cookieHeader, csrfToken };
  }

  describe('POST /auth/otp/request', () => {
    it('returns 200 with expiresAt and calls TermiiService', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({ phone: TEST_PHONE })
        .expect(200);

      expect(res.body.message).toBe('OTP sent successfully');
      expect(res.body.expiresAt).toBeDefined();
      expect(mockTermii.sendOtp).toHaveBeenCalledWith(TEST_PHONE, expect.any(String));
    });

    it('returns 400 for non-E.164 Nigerian phone', async () => {
      await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({ phone: '08012345678' })
        .expect(400);
    });

    it('returns 400 when phone is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/otp/request')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/otp/verify', () => {
    beforeEach(async () => {
      await prisma.otpRequest.deleteMany({ where: { phone: TEST_PHONE } });
    });

    it('returns 200 and sets httpOnly auth cookies on valid OTP', async () => {
      const code = await requestOtp(TEST_PHONE);
      const res = await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: TEST_PHONE, code })
        .expect(200);

      expect(res.body.user.phone).toBe(TEST_PHONE);

      const cookies = res.headers['set-cookie'] as string[];
      expect(cookies.some((c) => c.startsWith(`${ACCESS_COOKIE_NAME}=`))).toBe(true);
      expect(cookies.some((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`))).toBe(true);
      expect(cookies.some((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))).toBe(true);
      // access and refresh must be httpOnly
      const accessCookie = cookies.find((c) => c.startsWith(`${ACCESS_COOKIE_NAME}=`)) ?? '';
      expect(accessCookie.toLowerCase()).toContain('httponly');
      // CSRF must NOT be httpOnly (readable by JS)
      const csrfCookie = cookies.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`)) ?? '';
      expect(csrfCookie.toLowerCase()).not.toContain('httponly');
    });

    it('creates user record on first login', async () => {
      const code = await requestOtp(TEST_PHONE_2);
      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: TEST_PHONE_2, code })
        .expect(200);

      const user = await prisma.user.findUnique({ where: { phone: TEST_PHONE_2 } });
      expect(user).not.toBeNull();
      expect(user!.phone).toBe(TEST_PHONE_2);
    });

    it('returns 401 on wrong OTP code', async () => {
      await requestOtp(TEST_PHONE);
      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: TEST_PHONE, code: '000000' })
        .expect(401);
    });

    it('returns 401 when no valid OTP exists for phone', async () => {
      await request(app.getHttpServer())
        .post('/auth/otp/verify')
        .send({ phone: TEST_PHONE, code: '123456' })
        .expect(401);
    });
  });

  describe('GET /auth/csrf-token', () => {
    it('returns csrfToken and sets cookie', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/csrf-token')
        .expect(200);

      expect(typeof res.body.csrfToken).toBe('string');
      expect(res.body.csrfToken.length).toBeGreaterThan(0);
      const cookies = res.headers['set-cookie'] as string[];
      expect(cookies.some((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`))).toBe(true);
    });
  });

  describe('GET /auth/me', () => {
    it('returns current user when authenticated', async () => {
      await prisma.otpRequest.deleteMany({ where: { phone: TEST_PHONE } });
      const { cookieHeader } = await login(TEST_PHONE);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(res.body.user.phone).toBe(TEST_PHONE);
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('issues new access + refresh cookies', async () => {
      await prisma.otpRequest.deleteMany({ where: { phone: TEST_PHONE } });
      const { cookieHeader } = await login(TEST_PHONE);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookieHeader)
        .expect(200);

      expect(res.body.message).toBe('Tokens refreshed');
      const newCookies = res.headers['set-cookie'] as string[];
      expect(newCookies.some((c) => c.startsWith(`${ACCESS_COOKIE_NAME}=`))).toBe(true);
      expect(newCookies.some((c) => c.startsWith(`${REFRESH_COOKIE_NAME}=`))).toBe(true);
    });

    it('returns error without refresh token cookie', async () => {
      const res = await request(app.getHttpServer()).post('/auth/refresh');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears auth cookies and returns success', async () => {
      await prisma.otpRequest.deleteMany({ where: { phone: TEST_PHONE } });
      const { cookieHeader, csrfToken } = await login(TEST_PHONE);

      const res = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookieHeader)
        .set(CSRF_HEADER_NAME, csrfToken)
        .expect(200);

      expect(res.body.message).toBe('Logged out successfully');
    });

    it('returns 401 when unauthenticated', async () => {
      const csrfRes = await request(app.getHttpServer()).get('/auth/csrf-token');
      const csrfToken = csrfRes.body.csrfToken as string;
      const csrfCookie = (csrfRes.headers['set-cookie'] as string[])
        .map((c) => c.split(';')[0])
        .join('; ');

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', csrfCookie)
        .set(CSRF_HEADER_NAME, csrfToken)
        .expect(401);
    });

    it('returns 403 when CSRF token is missing', async () => {
      await prisma.otpRequest.deleteMany({ where: { phone: TEST_PHONE } });
      const { cookieHeader } = await login(TEST_PHONE);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', cookieHeader)
        .expect(403);
    });
  });
});
