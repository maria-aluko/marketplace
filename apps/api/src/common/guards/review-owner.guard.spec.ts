import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReviewOwnerGuard } from './review-owner.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@eventtrust/shared';

describe('ReviewOwnerGuard', () => {
  let guard: ReviewOwnerGuard;

  const mockPrisma = {
    review: {
      findFirst: vi.fn(),
    },
  };

  const createMockContext = (user: any, params: any = {}): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewOwnerGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<ReviewOwnerGuard>(ReviewOwnerGuard);
    vi.clearAllMocks();
  });

  it('should allow vendor who owns the review', async () => {
    mockPrisma.review.findFirst.mockResolvedValue({ vendorId: 'vendor-1' });

    const context = createMockContext(
      { sub: 'user-1', role: UserRole.VENDOR, vendorId: 'vendor-1' },
      { reviewId: 'review-1' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should reject non-owner vendor', async () => {
    mockPrisma.review.findFirst.mockResolvedValue({ vendorId: 'vendor-1' });

    const context = createMockContext(
      { sub: 'user-2', role: UserRole.VENDOR, vendorId: 'vendor-other' },
      { reviewId: 'review-1' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow admin to bypass ownership check', async () => {
    const context = createMockContext(
      { sub: 'admin-1', role: UserRole.ADMIN },
      { reviewId: 'review-1' },
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(mockPrisma.review.findFirst).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if review not found', async () => {
    mockPrisma.review.findFirst.mockResolvedValue(null);

    const context = createMockContext(
      { sub: 'user-1', role: UserRole.VENDOR, vendorId: 'vendor-1' },
      { reviewId: 'review-999' },
    );

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if no user', async () => {
    const context = createMockContext(null, { reviewId: 'review-1' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
