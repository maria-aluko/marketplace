import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PortfolioService } from './portfolio.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('PortfolioService', () => {
  let service: PortfolioService;

  const mockPrisma = {
    vendorPortfolio: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        CLOUDINARY_CLOUD_NAME: 'test-cloud',
        CLOUDINARY_API_KEY: 'test-api-key',
        CLOUDINARY_API_SECRET: 'test-api-secret',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const now = new Date();

  const makePortfolioItem = (overrides?: any) => ({
    id: 'item-1',
    vendorId: 'vendor-1',
    mediaUrl: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
    mediaType: 'IMAGE',
    caption: 'My event setup',
    sortOrder: 0,
    createdAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PortfolioService>(PortfolioService);
    vi.clearAllMocks();
  });

  describe('getSignedUploadUrl', () => {
    it('should return signed upload params', async () => {
      const result = await service.getSignedUploadUrl('vendor-1');

      expect(result.cloudName).toBe('test-cloud');
      expect(result.apiKey).toBe('test-api-key');
      expect(result.folder).toContain('vendor-1');
      expect(result.signature).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);
    });
  });

  describe('confirmUpload', () => {
    it('should create portfolio item and audit log', async () => {
      mockPrisma.vendorPortfolio.count
        .mockResolvedValueOnce(3)   // images
        .mockResolvedValueOnce(1);  // videos
      mockPrisma.vendorPortfolio.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
      mockPrisma.vendorPortfolio.create.mockResolvedValue(makePortfolioItem({ sortOrder: 3 }));

      const result = await service.confirmUpload('vendor-1', 'user-1', {
        publicId: 'test-public-id',
        mediaUrl: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg',
        mediaType: 'image' as any,
        caption: 'My event setup',
      });

      expect(result.id).toBe('item-1');
      expect(result.mediaType).toBe('image');
      expect(result.sortOrder).toBe(3);
      expect(mockPrisma.vendorPortfolio.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'portfolio.upload_confirmed',
          actorId: 'user-1',
          targetType: 'VendorPortfolio',
        }),
      );
    });

    it('should reject when image limit reached (10)', async () => {
      mockPrisma.vendorPortfolio.count
        .mockResolvedValueOnce(10)  // images at max
        .mockResolvedValueOnce(0);  // videos

      await expect(
        service.confirmUpload('vendor-1', 'user-1', {
          publicId: 'test-id',
          mediaUrl: 'https://example.com/img.jpg',
          mediaType: 'image' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject when video limit reached (2)', async () => {
      mockPrisma.vendorPortfolio.count
        .mockResolvedValueOnce(5)   // images
        .mockResolvedValueOnce(2);  // videos at max

      await expect(
        service.confirmUpload('vendor-1', 'user-1', {
          publicId: 'test-id',
          mediaUrl: 'https://example.com/vid.mp4',
          mediaType: 'video' as any,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow image when under limit', async () => {
      mockPrisma.vendorPortfolio.count
        .mockResolvedValueOnce(9)   // one slot left
        .mockResolvedValueOnce(0);
      mockPrisma.vendorPortfolio.aggregate.mockResolvedValue({ _max: { sortOrder: 8 } });
      mockPrisma.vendorPortfolio.create.mockResolvedValue(makePortfolioItem({ sortOrder: 9 }));

      const result = await service.confirmUpload('vendor-1', 'user-1', {
        publicId: 'test-id',
        mediaUrl: 'https://example.com/img.jpg',
        mediaType: 'image' as any,
      });

      expect(result).toBeDefined();
    });

    it('should set correct sort order when no existing items', async () => {
      mockPrisma.vendorPortfolio.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.vendorPortfolio.aggregate.mockResolvedValue({ _max: { sortOrder: null } });
      mockPrisma.vendorPortfolio.create.mockResolvedValue(makePortfolioItem({ sortOrder: 0 }));

      await service.confirmUpload('vendor-1', 'user-1', {
        publicId: 'test-id',
        mediaUrl: 'https://example.com/img.jpg',
        mediaType: 'image' as any,
      });

      expect(mockPrisma.vendorPortfolio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ sortOrder: 0 }),
        }),
      );
    });
  });

  describe('deleteItem', () => {
    it('should delete item and log audit', async () => {
      mockPrisma.vendorPortfolio.findFirst.mockResolvedValue(makePortfolioItem());
      mockPrisma.vendorPortfolio.delete.mockResolvedValue(makePortfolioItem());

      await service.deleteItem('item-1', 'vendor-1', 'user-1');

      expect(mockPrisma.vendorPortfolio.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'portfolio.item_deleted',
          targetId: 'item-1',
        }),
      );
    });

    it('should throw NotFoundException if item not found', async () => {
      mockPrisma.vendorPortfolio.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteItem('item-999', 'vendor-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if item belongs to different vendor', async () => {
      mockPrisma.vendorPortfolio.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteItem('item-1', 'vendor-other', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByVendorId', () => {
    it('should return items sorted by sortOrder', async () => {
      mockPrisma.vendorPortfolio.findMany.mockResolvedValue([
        makePortfolioItem({ id: 'item-1', sortOrder: 0 }),
        makePortfolioItem({ id: 'item-2', sortOrder: 1 }),
        makePortfolioItem({ id: 'item-3', sortOrder: 2 }),
      ]);

      const results = await service.findByVendorId('vendor-1');

      expect(results).toHaveLength(3);
      expect(results[0]!.sortOrder).toBe(0);
      expect(results[2]!.sortOrder).toBe(2);
      expect(mockPrisma.vendorPortfolio.findMany).toHaveBeenCalledWith({
        where: { vendorId: 'vendor-1' },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return empty array when no items', async () => {
      mockPrisma.vendorPortfolio.findMany.mockResolvedValue([]);

      const results = await service.findByVendorId('vendor-1');

      expect(results).toEqual([]);
    });
  });

  describe('toResponse', () => {
    it('should convert enum case and format dates', () => {
      const item = makePortfolioItem();
      const result = service.toResponse(item);

      expect(result.mediaType).toBe('image');
      expect(result.createdAt).toBe(now.toISOString());
      expect(result.caption).toBe('My event setup');
    });

    it('should handle null caption', () => {
      const item = makePortfolioItem({ caption: null });
      const result = service.toResponse(item);

      expect(result.caption).toBeUndefined();
    });
  });
});
