import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReviewScoreService } from './services/review-score.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockPrisma = {
    review: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    vendor: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    invoice: {
      findFirst: vi.fn(),
    },
    vendorReply: {
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const mockReviewScore = {
    recalculate: vi.fn().mockResolvedValue({ avgRating: 4.5, reviewCount: 10 }),
  };

  const mockNotifications = {
    notifyVendorNewReview: vi.fn().mockResolvedValue(undefined),
    notifyClientReviewApproved: vi.fn().mockResolvedValue(undefined),
  };

  const now = new Date();

  const makeReview = (overrides?: any) => ({
    id: 'review-1',
    vendorId: 'vendor-1',
    clientId: 'client-1',
    rating: 4,
    body: 'Great service, highly recommend this vendor for events in Lagos!',
    status: 'PENDING',
    reply: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  });

  const makeReply = (overrides?: any) => ({
    id: 'reply-1',
    reviewId: 'review-1',
    body: 'Thank you for your kind review!',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: ReviewScoreService, useValue: mockReviewScore },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    vi.clearAllMocks();
  });

  const makeInvoice = (overrides?: any) => ({
    id: 'invoice-1',
    vendorId: 'vendor-1',
    clientId: 'client-1',
    clientPhone: '+2348012345678',
    status: 'CONFIRMED',
    ...overrides,
  });

  describe('create', () => {
    it('should create review with PENDING status', async () => {
      mockPrisma.review.findFirst
        .mockResolvedValueOnce(null) // no existing vendor review this month
        .mockResolvedValueOnce(null); // no duplicate invoice review
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.user.findUnique.mockResolvedValue({ phone: '+2348012345678' });
      mockPrisma.vendor.findFirst.mockResolvedValue({ id: 'vendor-1', userId: 'vendor-user-1' });
      mockPrisma.review.create.mockResolvedValue(makeReview());

      const result = await service.create('client-1', {
        vendorId: 'vendor-1',
        invoiceId: 'invoice-1',
        rating: 4,
        body: 'Great service, highly recommend this vendor for events in Lagos!',
      });

      expect(result.id).toBe('review-1');
      expect(result.status).toBe('pending');
      expect(mockPrisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PENDING', invoiceId: 'invoice-1' }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'review.created' }),
      );
    });

    it('should reject duplicate review in same calendar month', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview());

      await expect(
        service.create('client-1', {
          vendorId: 'vendor-1',
          invoiceId: 'invoice-1',
          rating: 5,
          body: 'Another review that should be rejected since one already exists.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject review when invoice does not exist', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null); // no existing review
      mockPrisma.invoice.findFirst.mockResolvedValue(null); // invoice not found

      await expect(
        service.create('client-1', {
          vendorId: 'vendor-1',
          invoiceId: 'invoice-999',
          rating: 4,
          body: 'Review for an invoice that does not exist in the system.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject review when invoice belongs to a different vendor', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ vendorId: 'vendor-other' }));

      await expect(
        service.create('client-1', {
          vendorId: 'vendor-1',
          invoiceId: 'invoice-1',
          rating: 4,
          body: 'Review with mismatched vendor on the invoice provided.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject review when invoice status is DRAFT', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice({ status: 'DRAFT' }));
      mockPrisma.user.findUnique.mockResolvedValue({ phone: '+2348012345678' });

      await expect(
        service.create('client-1', {
          vendorId: 'vendor-1',
          invoiceId: 'invoice-1',
          rating: 4,
          body: 'Review for an invoice that has not been confirmed yet.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate review for same invoice', async () => {
      mockPrisma.review.findFirst
        .mockResolvedValueOnce(null) // no existing vendor review this month
        .mockResolvedValueOnce(makeReview()); // duplicate invoice review
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.user.findUnique.mockResolvedValue({ phone: '+2348012345678' });

      await expect(
        service.create('client-1', {
          vendorId: 'vendor-1',
          invoiceId: 'invoice-1',
          rating: 4,
          body: 'Attempting to submit a second review for the same invoice.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if vendor not found', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.findFirst.mockResolvedValue(makeInvoice());
      mockPrisma.user.findUnique.mockResolvedValue({ phone: '+2348012345678' });
      mockPrisma.vendor.findFirst.mockResolvedValue(null);

      await expect(
        service.create('client-1', {
          vendorId: 'vendor-999',
          invoiceId: 'invoice-1',
          rating: 4,
          body: 'Review for a vendor that does not exist in the system.',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByVendorId', () => {
    it('should return only approved reviews by default', async () => {
      mockPrisma.review.findMany.mockResolvedValue([
        makeReview({ status: 'APPROVED' }),
      ]);

      const results = await service.findByVendorId('vendor-1');

      expect(results).toHaveLength(1);
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'APPROVED' }),
        }),
      );
    });

    it('should return all reviews when includeAll is true', async () => {
      mockPrisma.review.findMany.mockResolvedValue([
        makeReview({ status: 'APPROVED' }),
        makeReview({ id: 'review-2', status: 'PENDING' }),
      ]);

      const results = await service.findByVendorId('vendor-1', { includeAll: true });

      expect(results).toHaveLength(2);
      expect(mockPrisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ status: 'APPROVED' }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return review with reply', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(
        makeReview({ reply: makeReply() }),
      );

      const result = await service.findById('review-1');

      expect(result).not.toBeNull();
      expect(result!.reply).toBeDefined();
      expect(result!.reply!.body).toBe('Thank you for your kind review!');
    });

    it('should return null for non-existent review', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);

      const result = await service.findById('review-999');

      expect(result).toBeNull();
    });
  });

  describe('approve', () => {
    it('should update status to APPROVED and recalculate score', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview());
      mockPrisma.review.update.mockResolvedValue(makeReview({ status: 'APPROVED' }));
      mockPrisma.user.findUnique.mockResolvedValue({ phone: '+2348099999999' });
      mockPrisma.vendor.findUnique.mockResolvedValue({ businessName: 'Best Caterers' });

      const result = await service.approve('review-1', 'admin-1');

      expect(result.status).toBe('approved');
      expect(mockReviewScore.recalculate).toHaveBeenCalledWith('vendor-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'review.approved' }),
      );
    });

    it('should throw NotFoundException if review not found', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);

      await expect(service.approve('review-999', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should update status to REJECTED with reason', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview());
      mockPrisma.review.update.mockResolvedValue(makeReview({ status: 'REJECTED' }));

      const result = await service.reject('review-1', 'admin-1', 'Inappropriate content');

      expect(result.status).toBe('rejected');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'review.rejected',
          metadata: expect.objectContaining({ reason: 'Inappropriate content' }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete and recalculate score', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview());
      mockPrisma.review.update.mockResolvedValue(makeReview({ deletedAt: now, status: 'REMOVED' }));

      await service.remove('review-1', 'admin-1', 'Spam content');

      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: 'review-1' },
        data: { deletedAt: expect.any(Date), status: 'REMOVED' },
      });
      expect(mockReviewScore.recalculate).toHaveBeenCalledWith('vendor-1');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'review.removed' }),
      );
    });

    it('should throw NotFoundException if review not found', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('review-999', 'admin-1', 'Reason'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createReply', () => {
    it('should create reply for review belonging to vendor', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview());
      mockPrisma.vendorReply.create.mockResolvedValue(makeReply());

      const result = await service.createReply('review-1', 'vendor-1', 'user-1', {
        body: 'Thank you for your kind review!',
      });

      expect(result.id).toBe('reply-1');
      expect(result.body).toBe('Thank you for your kind review!');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'review.reply_created' }),
      );
    });

    it('should reject reply if review belongs to different vendor', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview({ vendorId: 'vendor-other' }));

      await expect(
        service.createReply('review-1', 'vendor-1', 'user-1', {
          body: 'Should not be allowed',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject duplicate reply', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(
        makeReview({ reply: makeReply() }),
      );

      await expect(
        service.createReply('review-1', 'vendor-1', 'user-1', {
          body: 'Duplicate reply attempt',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateReply', () => {
    it('should update reply within 48h window', async () => {
      const recentReply = makeReply({ createdAt: new Date() }); // just created
      mockPrisma.review.findFirst.mockResolvedValue(makeReview({ reply: recentReply }));
      mockPrisma.vendorReply.update.mockResolvedValue(
        makeReply({ body: 'Updated reply text here' }),
      );

      const result = await service.updateReply('review-1', 'vendor-1', 'user-1', {
        body: 'Updated reply text here',
      });

      expect(result.body).toBe('Updated reply text here');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'review.reply_updated' }),
      );
    });

    it('should reject update after 48h window', async () => {
      const oldReply = makeReply({
        createdAt: new Date(Date.now() - 49 * 60 * 60 * 1000), // 49 hours ago
      });
      mockPrisma.review.findFirst.mockResolvedValue(makeReview({ reply: oldReply }));

      await expect(
        service.updateReply('review-1', 'vendor-1', 'user-1', {
          body: 'Too late to edit',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if no reply exists', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview({ reply: null }));

      await expect(
        service.updateReply('review-1', 'vendor-1', 'user-1', {
          body: 'No reply to update',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPending', () => {
    it('should return paginated pending reviews', async () => {
      mockPrisma.review.findMany.mockResolvedValue([
        makeReview({ id: 'r1' }),
        makeReview({ id: 'r2' }),
      ]);
      mockPrisma.review.count.mockResolvedValue(5);

      const result = await service.findPending(undefined, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should return nextCursor when more results exist', async () => {
      const reviews = Array.from({ length: 3 }, (_, i) =>
        makeReview({ id: `r${i}` }),
      );
      mockPrisma.review.findMany.mockResolvedValue(reviews);
      mockPrisma.review.count.mockResolvedValue(10);

      const result = await service.findPending(undefined, 2);

      expect(result.data).toHaveLength(2);
      expect(result.nextCursor).toBe('r1');
    });
  });
});
