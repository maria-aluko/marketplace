import { Test, TestingModule } from '@nestjs/testing';
import { ReviewScoreService } from './review-score.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReviewScoreService', () => {
  let service: ReviewScoreService;

  const mockPrisma = {
    review: {
      aggregate: vi.fn(),
    },
    vendor: {
      update: vi.fn(),
    },
    listing: {
      update: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewScoreService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ReviewScoreService>(ReviewScoreService);
    vi.clearAllMocks();
  });

  describe('recalculate', () => {
    it('should calculate correct avg and count from approved reviews', async () => {
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4.2 },
        _count: { rating: 10 },
      });
      mockPrisma.vendor.update.mockResolvedValue({});

      const result = await service.recalculate('vendor-1');

      expect(result.avgRating).toBe(4.2);
      expect(result.reviewCount).toBe(10);
      expect(mockPrisma.vendor.update).toHaveBeenCalledWith({
        where: { id: 'vendor-1' },
        data: { avgRating: 4.2, reviewCount: 10 },
      });
    });

    it('should handle zero reviews', async () => {
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      mockPrisma.vendor.update.mockResolvedValue({});

      const result = await service.recalculate('vendor-1');

      expect(result.avgRating).toBe(0);
      expect(result.reviewCount).toBe(0);
      expect(mockPrisma.vendor.update).toHaveBeenCalledWith({
        where: { id: 'vendor-1' },
        data: { avgRating: 0, reviewCount: 0 },
      });
    });

    it('should only count APPROVED non-deleted reviews', async () => {
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 5 },
        _count: { rating: 1 },
      });
      mockPrisma.vendor.update.mockResolvedValue({});

      await service.recalculate('vendor-1');

      expect(mockPrisma.review.aggregate).toHaveBeenCalledWith({
        where: {
          vendorId: 'vendor-1',
          status: 'APPROVED',
          deletedAt: null,
        },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });
  });

  describe('recalculateListing', () => {
    it('should calculate correct avg and count for a listing', async () => {
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 3.8 },
        _count: { rating: 5 },
      });
      mockPrisma.listing.update.mockResolvedValue({});

      const result = await service.recalculateListing('listing-1');

      expect(result.avgRating).toBe(3.8);
      expect(result.reviewCount).toBe(5);
      expect(mockPrisma.listing.update).toHaveBeenCalledWith({
        where: { id: 'listing-1' },
        data: { avgRating: 3.8, reviewCount: 5 },
      });
    });

    it('should handle zero listing reviews', async () => {
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: null },
        _count: { rating: 0 },
      });
      mockPrisma.listing.update.mockResolvedValue({});

      const result = await service.recalculateListing('listing-1');

      expect(result.avgRating).toBe(0);
      expect(result.reviewCount).toBe(0);
    });

    it('should only count APPROVED non-deleted reviews for listing', async () => {
      mockPrisma.review.aggregate.mockResolvedValue({
        _avg: { rating: 4 },
        _count: { rating: 2 },
      });
      mockPrisma.listing.update.mockResolvedValue({});

      await service.recalculateListing('listing-1');

      expect(mockPrisma.review.aggregate).toHaveBeenCalledWith({
        where: {
          listingId: 'listing-1',
          status: 'APPROVED',
          deletedAt: null,
        },
        _avg: { rating: true },
        _count: { rating: true },
      });
    });
  });
});
