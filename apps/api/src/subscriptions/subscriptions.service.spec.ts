import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  vendor: { findFirst: vi.fn() },
  listing: { count: vi.fn() },
  vendorPortfolio: { count: vi.fn() },
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  describe('enforceListingLimit', () => {
    it('allows free tier vendor with 0 listings', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'FREE' });
      mockPrisma.listing.count.mockResolvedValue(0);
      await expect(service.enforceListingLimit('vendor-1')).resolves.toBeUndefined();
    });

    it('blocks free tier vendor at limit (1)', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'FREE' });
      mockPrisma.listing.count.mockResolvedValue(1);
      await expect(service.enforceListingLimit('vendor-1')).rejects.toThrow(ForbiddenException);
    });

    it('allows pro tier vendor under limit (9 of 10)', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'PRO' });
      mockPrisma.listing.count.mockResolvedValue(9);
      await expect(service.enforceListingLimit('vendor-1')).resolves.toBeUndefined();
    });

    it('blocks pro tier vendor at limit (10)', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'PRO' });
      mockPrisma.listing.count.mockResolvedValue(10);
      await expect(service.enforceListingLimit('vendor-1')).rejects.toThrow(ForbiddenException);
    });

    it('never blocks pro_plus tier regardless of count', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'PRO_PLUS' });
      mockPrisma.listing.count.mockResolvedValue(999);
      await expect(service.enforceListingLimit('vendor-1')).resolves.toBeUndefined();
    });

    it('returns silently when vendor not found', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);
      await expect(service.enforceListingLimit('vendor-1')).resolves.toBeUndefined();
    });
  });

  describe('enforcePhotoLimit', () => {
    it('allows free tier vendor under photo limit (2 of 3)', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'FREE' });
      await expect(service.enforcePhotoLimit('vendor-1', 2)).resolves.toBeUndefined();
    });

    it('blocks free tier vendor at photo limit (3)', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'FREE' });
      await expect(service.enforcePhotoLimit('vendor-1', 3)).rejects.toThrow(ForbiddenException);
    });

    it('allows pro tier vendor under photo limit (19 of 20)', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'PRO' });
      await expect(service.enforcePhotoLimit('vendor-1', 19)).resolves.toBeUndefined();
    });

    it('never blocks pro_plus tier for photos', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ subscriptionTier: 'PRO_PLUS' });
      await expect(service.enforcePhotoLimit('vendor-1', 999)).resolves.toBeUndefined();
    });
  });
});
