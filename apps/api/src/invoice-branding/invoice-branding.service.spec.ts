import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvoiceBrandingService } from './invoice-branding.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('InvoiceBrandingService', () => {
  let service: InvoiceBrandingService;

  const mockPrisma = {
    vendor: {
      findFirst: vi.fn(),
    },
    invoiceBranding: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const mockConfig = {
    get: vi.fn((key: string, defaultVal?: string) => {
      const values: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'eventtrust-cloud',
        CLOUDINARY_API_KEY: 'api-key-123',
        CLOUDINARY_API_SECRET: 'api-secret-xyz',
      };
      return values[key] ?? defaultVal ?? '';
    }),
  };

  const now = new Date();

  const makeVendor = (overrides?: any) => ({
    id: 'vendor-1',
    businessName: 'Best Caterers Lagos',
    subscriptionTier: 'PRO',
    deletedAt: null,
    ...overrides,
  });

  const makeBranding = (overrides?: any) => ({
    id: 'branding-1',
    vendorId: 'vendor-1',
    logoUrl: null,
    accentColor: '#16a34a',
    tagline: 'Making your events unforgettable',
    footerText: 'Best Caterers Lagos — Serving since 2020',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceBrandingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<InvoiceBrandingService>(InvoiceBrandingService);
    vi.clearAllMocks();
  });

  describe('getBranding', () => {
    it('should return branding if it exists', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.invoiceBranding.findUnique.mockResolvedValue(makeBranding());

      const result = await service.getBranding('vendor-1');

      expect(result).not.toBeNull();
      expect(result!.accentColor).toBe('#16a34a');
    });

    it('should return null if no branding set', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.invoiceBranding.findUnique.mockResolvedValue(null);

      const result = await service.getBranding('vendor-1');

      expect(result).toBeNull();
    });

    it('should throw NotFoundException if vendor not found', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);

      await expect(service.getBranding('vendor-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('upsertBranding', () => {
    it('should upsert branding for PRO vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor({ subscriptionTier: 'PRO' }));
      mockPrisma.invoiceBranding.upsert.mockResolvedValue(makeBranding());

      const result = await service.upsertBranding('vendor-1', 'user-1', {
        accentColor: '#16a34a',
        tagline: 'Making your events unforgettable',
      });

      expect(result.accentColor).toBe('#16a34a');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invoice_branding.updated' }),
      );
    });

    it('should upsert branding for PRO_PLUS vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor({ subscriptionTier: 'PRO_PLUS' }));
      mockPrisma.invoiceBranding.upsert.mockResolvedValue(makeBranding());

      const result = await service.upsertBranding('vendor-1', 'user-1', {
        accentColor: '#dc2626',
      });

      expect(result).not.toBeNull();
    });

    it('should throw ForbiddenException for FREE tier vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor({ subscriptionTier: 'FREE' }));

      await expect(
        service.upsertBranding('vendor-1', 'user-1', { accentColor: '#16a34a' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if vendor not found', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);

      await expect(
        service.upsertBranding('vendor-999', 'user-1', { accentColor: '#16a34a' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirmLogoUpload', () => {
    it('should save logo URL for PRO vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.invoiceBranding.upsert.mockResolvedValue(
        makeBranding({ logoUrl: 'https://res.cloudinary.com/eventtrust-cloud/logo.jpg' }),
      );

      const result = await service.confirmLogoUpload(
        'vendor-1',
        'user-1',
        'https://res.cloudinary.com/eventtrust-cloud/logo.jpg',
      );

      expect(result.logoUrl).toBe('https://res.cloudinary.com/eventtrust-cloud/logo.jpg');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invoice_branding.logo_uploaded' }),
      );
    });

    it('should throw ForbiddenException for FREE tier on logo upload', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor({ subscriptionTier: 'FREE' }));

      await expect(
        service.confirmLogoUpload('vendor-1', 'user-1', 'https://example.com/logo.jpg'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getLogoUploadUrl', () => {
    it('should return signed upload params for PRO vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());

      const result = await service.getLogoUploadUrl('vendor-1');

      expect(result.cloudName).toBe('eventtrust-cloud');
      expect(result.apiKey).toBe('api-key-123');
      expect(result.signature).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.folder).toBe('eventtrust/logos');
    });

    it('should throw ForbiddenException for FREE tier on upload URL', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor({ subscriptionTier: 'FREE' }));

      await expect(service.getLogoUploadUrl('vendor-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteLogo', () => {
    it('should clear logo URL', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.invoiceBranding.findUnique.mockResolvedValue(makeBranding({ logoUrl: 'https://example.com/logo.jpg' }));
      mockPrisma.invoiceBranding.update.mockResolvedValue(makeBranding({ logoUrl: null }));

      await service.deleteLogo('vendor-1', 'user-1');

      expect(mockPrisma.invoiceBranding.update).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-1' },
        data: { logoUrl: null },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'invoice_branding.logo_deleted' }),
      );
    });

    it('should throw NotFoundException if branding does not exist', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor());
      mockPrisma.invoiceBranding.findUnique.mockResolvedValue(null);

      await expect(service.deleteLogo('vendor-1', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
