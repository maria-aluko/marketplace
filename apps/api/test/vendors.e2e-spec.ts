import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { vi } from 'vitest';
import { AppModule } from '../src/app.module';
import { TermiiService } from '../src/auth/services/termii.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { CSRF_HEADER_NAME, CSRF_COOKIE_NAME } from '@eventtrust/shared';

const VENDOR_PHONE = '+2349900000003';
const ADMIN_PHONE = '+2349900000004';
const OTHER_PHONE = '+2349900000005';

const TEST_VENDOR_PAYLOAD = {
  businessName: 'E2E Test Catering',
  category: 'caterer',
  description: 'Professional catering services for all events in Lagos.',
  area: 'Lekki',
};

describe('Vendors (e2e)', () => {
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
    await cleanupTestData();

    // Create admin user directly — OTP flow creates CLIENT, so we bypass it
    await prisma.user.upsert({
      where: { phone: ADMIN_PHONE },
      update: {},
      create: {
        phone: ADMIN_PHONE,
        role: 'ADMIN',
        authIdentities: { create: { provider: 'PHONE', providerId: ADMIN_PHONE } },
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    const phones = [VENDOR_PHONE, ADMIN_PHONE, OTHER_PHONE];
    await prisma.otpRequest.deleteMany({ where: { phone: { in: phones } } });
    const users = await prisma.user.findMany({ where: { phone: { in: phones } } });
    if (users.length > 0) {
      const ids = users.map((u) => u.id);
      // Delete admin logs before deleting users (no cascade)
      const vendorIds = await prisma.vendor
        .findMany({ where: { userId: { in: ids } } })
        .then((vs) => vs.map((v) => v.id));
      await prisma.adminLog.deleteMany({
        where: { adminId: { in: ids } },
      });
      if (vendorIds.length > 0) {
        await prisma.adminLog.deleteMany({ where: { entityId: { in: vendorIds } } });
      }
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

  async function refreshLogin(
    cookieHeader: string,
  ): Promise<{ cookieHeader: string; csrfToken: string }> {
    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookieHeader)
      .expect(200);
    const setCookies = res.headers['set-cookie'] as string[];
    const newCookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');
    // CSRF token doesn't change on refresh — extract from existing cookieHeader
    const csrfEntry = cookieHeader
      .split('; ')
      .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`)) ?? '';
    const csrfToken = csrfEntry.split('=')[1] ?? '';
    return { cookieHeader: newCookieHeader + '; ' + csrfEntry, csrfToken };
  }

  describe('GET /vendors/:id (public)', () => {
    it('returns 404 for non-existent vendor', async () => {
      await request(app.getHttpServer())
        .get('/vendors/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('POST /vendors', () => {
    it('returns 403 when unauthenticated (CSRF blocks before JWT guard)', async () => {
      await request(app.getHttpServer())
        .post('/vendors')
        .send(TEST_VENDOR_PAYLOAD)
        .expect(403);
    });

    it('returns 403 when CSRF token is missing', async () => {
      await prisma.otpRequest.deleteMany({ where: { phone: VENDOR_PHONE } });
      const { cookieHeader } = await login(VENDOR_PHONE);

      await request(app.getHttpServer())
        .post('/vendors')
        .set('Cookie', cookieHeader)
        .send(TEST_VENDOR_PAYLOAD)
        .expect(403);
    });

    it('creates vendor and returns 201', async () => {
      await prisma.otpRequest.deleteMany({ where: { phone: VENDOR_PHONE } });
      const { cookieHeader, csrfToken } = await login(VENDOR_PHONE);

      const res = await request(app.getHttpServer())
        .post('/vendors')
        .set('Cookie', cookieHeader)
        .set(CSRF_HEADER_NAME, csrfToken)
        .send(TEST_VENDOR_PAYLOAD)
        .expect(201);

      expect(res.body.data.businessName).toBe(TEST_VENDOR_PAYLOAD.businessName);
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.slug).toBeDefined();
    });

    it('returns 400 if user already has a vendor', async () => {
      // VENDOR_PHONE already has a vendor from previous test
      await prisma.otpRequest.deleteMany({ where: { phone: VENDOR_PHONE } });
      const { cookieHeader, csrfToken } = await login(VENDOR_PHONE);

      await request(app.getHttpServer())
        .post('/vendors')
        .set('Cookie', cookieHeader)
        .set(CSRF_HEADER_NAME, csrfToken)
        .send({ ...TEST_VENDOR_PAYLOAD, businessName: 'Another Business' })
        .expect(400);
    });
  });

  describe('GET /vendors/:id (public)', () => {
    it('returns vendor by ID', async () => {
      const vendor = await prisma.vendor.findFirst({
        where: { user: { phone: VENDOR_PHONE } },
      });
      expect(vendor).not.toBeNull();

      const res = await request(app.getHttpServer())
        .get(`/vendors/${vendor!.id}`)
        .expect(200);

      expect(res.body.data.id).toBe(vendor!.id);
      expect(res.body.data.businessName).toBe(TEST_VENDOR_PAYLOAD.businessName);
    });
  });

  describe('PATCH /vendors/:id', () => {
    it('returns 403 for non-owner', async () => {
      const vendor = await prisma.vendor.findFirst({
        where: { user: { phone: VENDOR_PHONE } },
      });

      await prisma.otpRequest.deleteMany({ where: { phone: OTHER_PHONE } });
      const { cookieHeader, csrfToken } = await login(OTHER_PHONE);

      await request(app.getHttpServer())
        .patch(`/vendors/${vendor!.id}`)
        .set('Cookie', cookieHeader)
        .set(CSRF_HEADER_NAME, csrfToken)
        .send({ description: 'Trying to update someone else' })
        .expect(403);
    });

    it('updates vendor for owner', async () => {
      const vendor = await prisma.vendor.findFirst({
        where: { user: { phone: VENDOR_PHONE } },
      });

      // Need to refresh to get vendorId in JWT
      await prisma.otpRequest.deleteMany({ where: { phone: VENDOR_PHONE } });
      const { cookieHeader: initialCookies } = await login(VENDOR_PHONE);
      const { cookieHeader, csrfToken } = await refreshLogin(initialCookies);

      const res = await request(app.getHttpServer())
        .patch(`/vendors/${vendor!.id}`)
        .set('Cookie', cookieHeader)
        .set(CSRF_HEADER_NAME, csrfToken)
        .send({ description: 'Updated catering description with at least 20 chars.' })
        .expect(200);

      expect(res.body.data.description).toBe(
        'Updated catering description with at least 20 chars.',
      );
    });
  });

  describe('POST /vendors/:id/submit', () => {
    it('transitions vendor from draft to pending', async () => {
      const vendor = await prisma.vendor.findFirst({
        where: { user: { phone: VENDOR_PHONE } },
      });

      await prisma.otpRequest.deleteMany({ where: { phone: VENDOR_PHONE } });
      const { cookieHeader: initialCookies } = await login(VENDOR_PHONE);
      const { cookieHeader, csrfToken } = await refreshLogin(initialCookies);

      const res = await request(app.getHttpServer())
        .post(`/vendors/${vendor!.id}/submit`)
        .set('Cookie', cookieHeader)
        .set(CSRF_HEADER_NAME, csrfToken)
        .expect(200);

      expect(res.body.data.status).toBe('pending');
    });
  });

  describe('PATCH /vendors/:id/status (admin)', () => {
    it('returns 403 for non-admin user', async () => {
      const vendor = await prisma.vendor.findFirst({
        where: { user: { phone: VENDOR_PHONE } },
      });

      await prisma.otpRequest.deleteMany({ where: { phone: OTHER_PHONE } });
      const { cookieHeader, csrfToken } = await login(OTHER_PHONE);

      await request(app.getHttpServer())
        .patch(`/vendors/${vendor!.id}/status`)
        .set('Cookie', cookieHeader)
        .set(CSRF_HEADER_NAME, csrfToken)
        .send({ vendorId: vendor!.id, newStatus: 'active' })
        .expect(403);
    });

    it('allows admin to approve pending vendor', async () => {
      const vendor = await prisma.vendor.findFirst({
        where: { user: { phone: VENDOR_PHONE } },
      });

      await prisma.otpRequest.deleteMany({ where: { phone: ADMIN_PHONE } });
      const { cookieHeader, csrfToken } = await login(ADMIN_PHONE);

      const res = await request(app.getHttpServer())
        .patch(`/vendors/${vendor!.id}/status`)
        .set('Cookie', cookieHeader)
        .set(CSRF_HEADER_NAME, csrfToken)
        .send({ vendorId: vendor!.id, newStatus: 'active' })
        .expect(200);

      // status is raw Prisma enum (uppercase) — no toResponse() in updateStatus controller
      expect(res.body.data.status).toBe('ACTIVE');
    });
  });

  describe('GET /vendors/slug/:slug (public)', () => {
    it('returns vendor by slug', async () => {
      const vendor = await prisma.vendor.findFirst({
        where: { user: { phone: VENDOR_PHONE } },
      });

      const res = await request(app.getHttpServer())
        .get(`/vendors/slug/${vendor!.slug}`)
        .expect(200);

      expect(res.body.data.slug).toBe(vendor!.slug);
    });

    it('returns 404 for unknown slug', async () => {
      await request(app.getHttpServer())
        .get('/vendors/slug/this-slug-does-not-exist-xyz')
        .expect(404);
    });
  });
});
