import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DisputesService } from './disputes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReviewsService } from '../reviews/reviews.service';
import { DISPUTE_RAISE_WINDOW_HOURS, DISPUTE_APPEAL_WINDOW_HOURS } from '@eventtrust/shared';

describe('DisputesService', () => {
  let service: DisputesService;

  const mockPrisma = {
    review: {
      findFirst: vi.fn(),
    },
    dispute: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const mockReviewsService = {
    remove: vi.fn().mockResolvedValue(undefined),
  };

  const now = new Date();

  const makeReview = (overrides?: any) => ({
    id: 'review-1',
    vendorId: 'vendor-1',
    status: 'APPROVED',
    updatedAt: now,
    ...overrides,
  });

  const mockConfigService = {
    get: vi.fn((key: string, defaultValue?: string) => defaultValue ?? ''),
  };

  const makeDispute = (overrides?: any) => ({
    id: 'dispute-1',
    reviewId: 'review-1',
    vendorId: 'vendor-1',
    reason: 'This review contains false claims about my service.',
    status: 'OPEN',
    adminDecision: null,
    policyClause: null,
    appealReason: null,
    evidence: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: ReviewsService, useValue: mockReviewsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DisputesService>(DisputesService);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a dispute for an approved review within 72h', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview());
      mockPrisma.dispute.findUnique.mockResolvedValue(null);
      mockPrisma.dispute.create.mockResolvedValue(makeDispute());

      const result = await service.create('vendor-1', 'user-1', {
        reviewId: 'review-1',
        reason: 'This review contains false claims about my service.',
      });

      expect(result.id).toBe('dispute-1');
      expect(result.status).toBe('open');
      expect(mockPrisma.dispute.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'OPEN', vendorId: 'vendor-1' }),
        }),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'dispute.created' }),
      );
    });

    it('should reject dispute if 72h window has expired', async () => {
      const oldDate = new Date(Date.now() - (DISPUTE_RAISE_WINDOW_HOURS + 1) * 60 * 60 * 1000);
      mockPrisma.review.findFirst.mockResolvedValue(makeReview({ updatedAt: oldDate }));

      await expect(
        service.create('vendor-1', 'user-1', {
          reviewId: 'review-1',
          reason: 'This review contains false claims about my service.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate dispute on same review', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview());
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute());

      await expect(
        service.create('vendor-1', 'user-1', {
          reviewId: 'review-1',
          reason: 'This review contains false claims about my service.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject dispute if review is not APPROVED', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(makeReview({ status: 'PENDING' }));

      await expect(
        service.create('vendor-1', 'user-1', {
          reviewId: 'review-1',
          reason: 'This review contains false claims about my service.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if review not found', async () => {
      mockPrisma.review.findFirst.mockResolvedValue(null);

      await expect(
        service.create('vendor-1', 'user-1', {
          reviewId: 'review-999',
          reason: 'This review contains false claims about my service.',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('decide', () => {
    it('should decide a dispute and remove review when flagged', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute());
      mockPrisma.dispute.update.mockResolvedValue(
        makeDispute({ status: 'DECIDED', adminDecision: 'Removed', policyClause: '3.1' }),
      );

      const result = await service.decide('dispute-1', 'admin-1', {
        decision: 'Review violated terms of service',
        policyClause: '3.1',
        removeReview: true,
      });

      expect(result.status).toBe('decided');
      expect(mockReviewsService.remove).toHaveBeenCalledWith('review-1', 'admin-1', expect.any(String));
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'dispute.decided' }),
      );
    });

    it('should decide without removing review when removeReview is false', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute());
      mockPrisma.dispute.update.mockResolvedValue(makeDispute({ status: 'DECIDED' }));

      await service.decide('dispute-1', 'admin-1', {
        decision: 'Review is within guidelines',
        policyClause: '1.0',
        removeReview: false,
      });

      expect(mockReviewsService.remove).not.toHaveBeenCalled();
    });

    it('should reject decision on non-OPEN dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute({ status: 'DECIDED' }));

      await expect(
        service.decide('dispute-1', 'admin-1', {
          decision: 'Ruling',
          policyClause: '1.0',
          removeReview: false,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('appeal', () => {
    it('should appeal a DECIDED dispute within 48h', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute({ status: 'DECIDED' }));
      mockPrisma.dispute.update.mockResolvedValue(
        makeDispute({ status: 'APPEALED', appealReason: 'The decision is incorrect.' }),
      );

      const result = await service.appeal('dispute-1', 'vendor-1', 'user-1', {
        reason: 'The decision is incorrect.',
      });

      expect(result.status).toBe('appealed');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'dispute.appealed' }),
      );
    });

    it('should reject appeal after 48h window expires', async () => {
      const oldDate = new Date(Date.now() - (DISPUTE_APPEAL_WINDOW_HOURS + 1) * 60 * 60 * 1000);
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute({ status: 'DECIDED', updatedAt: oldDate }));

      await expect(
        service.appeal('dispute-1', 'vendor-1', 'user-1', {
          reason: 'The decision is incorrect.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject double appeal', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(
        makeDispute({ status: 'DECIDED', appealReason: 'Already appealed' }),
      );

      await expect(
        service.appeal('dispute-1', 'vendor-1', 'user-1', {
          reason: 'Second appeal attempt.',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject appeal on non-DECIDED dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute({ status: 'OPEN' }));

      await expect(
        service.appeal('dispute-1', 'vendor-1', 'user-1', {
          reason: 'Appealing an open dispute.',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('close', () => {
    it('should close an APPEALED dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute({ status: 'APPEALED' }));
      mockPrisma.dispute.update.mockResolvedValue(makeDispute({ status: 'CLOSED' }));

      const result = await service.close('dispute-1', 'admin-1');

      expect(result.status).toBe('closed');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'dispute.closed' }),
      );
    });

    it('should reject closing a non-APPEALED dispute', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue(makeDispute({ status: 'DECIDED' }));

      await expect(service.close('dispute-1', 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });
});
