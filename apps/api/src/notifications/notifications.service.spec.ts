import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        NODE_ENV: 'development',
        TERMII_API_KEY: 'test-key',
        TERMII_SENDER_ID: 'EventTrust',
        RESEND_API_KEY: 'test-resend-key',
        FROM_EMAIL: 'test@eventtrust.com.ng',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    vi.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should log email in dev mode instead of sending', async () => {
      const logSpy = vi.spyOn((service as any).logger, 'log');

      await service.sendEmail('test@example.com', 'Test Subject', '<p>Hello</p>');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEV] Email to test@example.com'),
      );
    });

    it('should not throw on failure', async () => {
      // Force isDev to false to hit the fetch path
      (service as any).isDev = false;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect(
        service.sendEmail('test@example.com', 'Test', '<p>Hi</p>'),
      ).resolves.toBeUndefined();

      fetchSpy.mockRestore();
    });
  });

  describe('sendSms', () => {
    it('should log SMS in dev mode instead of sending', async () => {
      const logSpy = vi.spyOn((service as any).logger, 'log');

      await service.sendSms('+2348012345678', 'Test message');

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEV] SMS to +2348012345678'),
      );
    });

    it('should not throw on failure', async () => {
      (service as any).isDev = false;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      await expect(
        service.sendSms('+2348012345678', 'Test'),
      ).resolves.toBeUndefined();

      fetchSpy.mockRestore();
    });
  });

  describe('notifyVendorNewReview', () => {
    it('should send SMS with reviewer name', async () => {
      const sendSmsSpy = vi.spyOn(service, 'sendSms').mockResolvedValue(undefined);

      await service.notifyVendorNewReview('+2348012345678', 'John Doe');

      expect(sendSmsSpy).toHaveBeenCalledWith(
        '+2348012345678',
        expect.stringContaining('John Doe'),
      );
    });
  });

  describe('notifyClientReviewApproved', () => {
    it('should send SMS with vendor name', async () => {
      const sendSmsSpy = vi.spyOn(service, 'sendSms').mockResolvedValue(undefined);

      await service.notifyClientReviewApproved('+2348012345678', 'Best Caterers');

      expect(sendSmsSpy).toHaveBeenCalledWith(
        '+2348012345678',
        expect.stringContaining('Best Caterers'),
      );
    });
  });
});
