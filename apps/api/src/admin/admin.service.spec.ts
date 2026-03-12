import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockPrisma = {
    vendor: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    review: {
      count: vi.fn(),
    },
    dispute: {
      count: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
  };

  const mockReviewsService = {
    findPending: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
    remove: vi.fn(),
  };

  const now = new Date();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ReviewsService, useValue: mockReviewsService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    vi.clearAllMocks();
  });

  describe('getAnalytics', () => {
    it('should return correct counts', async () => {
      mockPrisma.vendor.count
        .mockResolvedValueOnce(50)  // totalVendors
        .mockResolvedValueOnce(30)  // activeVendors
        .mockResolvedValueOnce(5);  // pendingVendors
      mockPrisma.review.count
        .mockResolvedValueOnce(200) // totalReviews
        .mockResolvedValueOnce(10); // pendingReviews
      mockPrisma.dispute.count.mockResolvedValue(3);
      mockPrisma.user.count.mockResolvedValue(1000);

      const result = await service.getAnalytics();

      expect(result).toEqual({
        totalVendors: 50,
        activeVendors: 30,
        pendingVendors: 5,
        totalReviews: 200,
        pendingReviews: 10,
        openDisputes: 3,
        totalClients: 1000,
      });
    });
  });

  describe('getPendingVendors', () => {
    it('should return only PENDING vendors', async () => {
      const pendingVendor = {
        id: 'v1',
        slug: 'test-vendor',
        businessName: 'Test Vendor',
        category: 'CATERER',
        description: 'A test vendor',
        area: 'Lekki',
        address: null,
        priceFrom: null,
        priceTo: null,
        whatsappNumber: null,
        instagramHandle: null,
        coverImageUrl: null,
        status: 'PENDING',
        avgRating: 0,
        reviewCount: 0,
        profileCompleteScore: 0.5,
        userId: 'user-1',
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };

      mockPrisma.vendor.findMany.mockResolvedValue([pendingVendor]);
      mockPrisma.vendor.count.mockResolvedValue(1);

      const result = await service.getPendingVendors();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.status).toBe('pending');
      expect(result.total).toBe(1);
      expect(mockPrisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PENDING' }),
        }),
      );
    });

    it('should support cursor pagination', async () => {
      mockPrisma.vendor.findMany.mockResolvedValue([]);
      mockPrisma.vendor.count.mockResolvedValue(0);

      await service.getPendingVendors('cursor-id', 10);

      expect(mockPrisma.vendor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { lt: 'cursor-id' },
          }),
          take: 11,
        }),
      );
    });
  });

  describe('getPendingReviews', () => {
    it('should delegate to ReviewsService.findPending', async () => {
      const expected = { data: [], total: 0 };
      mockReviewsService.findPending.mockResolvedValue(expected);

      const result = await service.getPendingReviews();

      expect(result).toEqual(expected);
      expect(mockReviewsService.findPending).toHaveBeenCalled();
    });
  });

  describe('approveReview', () => {
    it('should delegate to ReviewsService.approve', async () => {
      const expected = { id: 'r1', status: 'approved' };
      mockReviewsService.approve.mockResolvedValue(expected);

      const result = await service.approveReview('r1', 'admin-1');

      expect(result).toEqual(expected);
      expect(mockReviewsService.approve).toHaveBeenCalledWith('r1', 'admin-1');
    });
  });

  describe('rejectReview', () => {
    it('should delegate to ReviewsService.reject', async () => {
      const expected = { id: 'r1', status: 'rejected' };
      mockReviewsService.reject.mockResolvedValue(expected);

      const result = await service.rejectReview('r1', 'admin-1', 'Spam');

      expect(result).toEqual(expected);
      expect(mockReviewsService.reject).toHaveBeenCalledWith('r1', 'admin-1', 'Spam');
    });
  });

  describe('removeReview', () => {
    it('should delegate to ReviewsService.remove', async () => {
      mockReviewsService.remove.mockResolvedValue(undefined);

      await service.removeReview('r1', 'admin-1', 'Violation');

      expect(mockReviewsService.remove).toHaveBeenCalledWith('r1', 'admin-1', 'Violation');
    });
  });
});
