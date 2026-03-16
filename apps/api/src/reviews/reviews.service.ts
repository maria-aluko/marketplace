import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReviewScoreService } from './services/review-score.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VENDOR_REPLY_EDIT_WINDOW_HOURS } from '@eventtrust/shared';
import type {
  CreateReviewPayload,
  ReviewResponse,
  VendorReplyResponse,
  CreateVendorReplyPayload,
  PaginatedResponse,
} from '@eventtrust/shared';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly reviewScoreService: ReviewScoreService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(clientId: string, data: CreateReviewPayload): Promise<ReviewResponse> {
    // Check one-per-month per vendor rule (loose)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const existingVendorReview = await this.prisma.review.findFirst({
      where: {
        clientId,
        vendorId: data.vendorId,
        deletedAt: null,
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
    });

    if (existingVendorReview) {
      throw new BadRequestException('You can only review this vendor once per calendar month');
    }

    // Check one-per-month per listing rule (strict, only if listing specified)
    if (data.listingId) {
      const existingListingReview = await this.prisma.review.findFirst({
        where: {
          clientId,
          listingId: data.listingId,
          deletedAt: null,
          createdAt: {
            gte: startOfMonth,
            lt: endOfMonth,
          },
        },
      });

      if (existingListingReview) {
        throw new BadRequestException('You can only review this listing once per calendar month');
      }

      // Verify listing exists and belongs to the vendor
      const listing = await this.prisma.listing.findFirst({
        where: { id: data.listingId, vendorId: data.vendorId, deletedAt: null },
      });

      if (!listing) {
        throw new BadRequestException('Listing not found or does not belong to this vendor');
      }
    }

    // Verify vendor exists and is active
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: data.vendorId, deletedAt: null, status: 'ACTIVE' },
      select: { id: true, userId: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found or not active');
    }

    // Validate invoiceId ownership if provided
    if (data.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: data.invoiceId, vendorId: data.vendorId, clientId },
        select: { id: true },
      });
      if (!invoice) {
        throw new BadRequestException('Invoice not found or does not belong to this booking');
      }
    }

    const review = await this.prisma.review.create({
      data: {
        vendorId: data.vendorId,
        clientId,
        listingId: data.listingId ?? null,
        invoiceId: data.invoiceId ?? null,
        rating: data.rating,
        body: data.body,
        status: 'PENDING',
      },
      include: { reply: true },
    });

    await this.auditService.log({
      action: 'review.created',
      actorId: clientId,
      targetType: 'Review',
      targetId: review.id,
      metadata: { vendorId: data.vendorId, rating: data.rating },
    });

    // Fire-and-forget notification
    const vendorUser = await this.prisma.user.findUnique({
      where: { id: vendor.userId },
      select: { phone: true },
    });
    if (vendorUser) {
      this.notificationsService.notifyVendorNewReview(vendorUser.phone, 'A client').catch(() => {});
    }

    return this.toResponse(review);
  }

  async findByVendorId(
    vendorId: string,
    options?: { includeAll?: boolean },
  ): Promise<ReviewResponse[]> {
    const where: any = { vendorId, deletedAt: null };
    if (!options?.includeAll) {
      where.status = 'APPROVED';
    }

    const reviews = await this.prisma.review.findMany({
      where,
      include: { reply: true },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((r: any) => this.toResponse(r));
  }

  async findById(reviewId: string): Promise<ReviewResponse | null> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
      include: { reply: true },
    });

    return review ? this.toResponse(review) : null;
  }

  async approve(reviewId: string, adminId: string): Promise<ReviewResponse> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: 'APPROVED' },
      include: { reply: true },
    });

    await this.reviewScoreService.recalculate(review.vendorId);

    if (review.listingId) {
      await this.reviewScoreService.recalculateListing(review.listingId);
    }

    await this.auditService.log({
      action: 'review.approved',
      actorId: adminId,
      targetType: 'Review',
      targetId: reviewId,
      metadata: { vendorId: review.vendorId },
    });

    // Fire-and-forget notification to client
    const client = await this.prisma.user.findUnique({
      where: { id: review.clientId },
      select: { phone: true },
    });
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: review.vendorId },
      select: { businessName: true },
    });
    if (client && vendor) {
      this.notificationsService
        .notifyClientReviewApproved(client.phone, vendor.businessName)
        .catch(() => {});
    }

    return this.toResponse(updated);
  }

  async reject(reviewId: string, adminId: string, reason: string): Promise<ReviewResponse> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status: 'REJECTED' },
      include: { reply: true },
    });

    await this.auditService.log({
      action: 'review.rejected',
      actorId: adminId,
      targetType: 'Review',
      targetId: reviewId,
      metadata: { vendorId: review.vendorId, reason },
    });

    return this.toResponse(updated);
  }

  async remove(reviewId: string, adminId: string, reason: string): Promise<void> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date(), status: 'REMOVED' },
    });

    await this.reviewScoreService.recalculate(review.vendorId);

    if (review.listingId) {
      await this.reviewScoreService.recalculateListing(review.listingId);
    }

    await this.auditService.log({
      action: 'review.removed',
      actorId: adminId,
      targetType: 'Review',
      targetId: reviewId,
      metadata: { vendorId: review.vendorId, reason },
    });
  }

  async createReply(
    reviewId: string,
    vendorId: string,
    actorId: string,
    data: CreateVendorReplyPayload,
  ): Promise<VendorReplyResponse> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
      include: { reply: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.vendorId !== vendorId) {
      throw new ForbiddenException('This review does not belong to your vendor profile');
    }

    if (review.reply) {
      throw new BadRequestException('A reply already exists for this review');
    }

    const reply = await this.prisma.vendorReply.create({
      data: {
        reviewId,
        body: data.body,
      },
    });

    await this.auditService.log({
      action: 'review.reply_created',
      actorId,
      targetType: 'VendorReply',
      targetId: reply.id,
      metadata: { reviewId, vendorId },
    });

    return this.toReplyResponse(reply);
  }

  async updateReply(
    reviewId: string,
    vendorId: string,
    actorId: string,
    data: CreateVendorReplyPayload,
  ): Promise<VendorReplyResponse> {
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
      include: { reply: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.vendorId !== vendorId) {
      throw new ForbiddenException('This review does not belong to your vendor profile');
    }

    if (!review.reply) {
      throw new NotFoundException('No reply found for this review');
    }

    // Check 48h edit window
    const replyAge = Date.now() - review.reply.createdAt.getTime();
    const windowMs = VENDOR_REPLY_EDIT_WINDOW_HOURS * 60 * 60 * 1000;

    if (replyAge > windowMs) {
      throw new BadRequestException(
        `Reply can only be edited within ${VENDOR_REPLY_EDIT_WINDOW_HOURS} hours of creation`,
      );
    }

    const updated = await this.prisma.vendorReply.update({
      where: { id: review.reply.id },
      data: { body: data.body },
    });

    await this.auditService.log({
      action: 'review.reply_updated',
      actorId,
      targetType: 'VendorReply',
      targetId: updated.id,
      metadata: { reviewId, vendorId },
    });

    return this.toReplyResponse(updated);
  }

  async findPending(
    cursor?: string,
    limit: number = 20,
  ): Promise<PaginatedResponse<ReviewResponse>> {
    const where: any = { status: 'PENDING', deletedAt: null };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { reply: true },
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      }),
      this.prisma.review.count({ where: { status: 'PENDING', deletedAt: null } }),
    ]);

    const hasMore = reviews.length > limit;
    const items = hasMore ? reviews.slice(0, limit) : reviews;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : undefined;

    return {
      data: items.map((r: any) => this.toResponse(r)),
      nextCursor,
      total,
    };
  }

  toResponse(review: any): ReviewResponse {
    return {
      id: review.id,
      vendorId: review.vendorId,
      listingId: review.listingId ?? undefined,
      clientId: review.clientId,
      rating: review.rating,
      body: review.body,
      status: review.status.toLowerCase() as any,
      isVerified: review.invoiceId != null,
      reply: review.reply ? this.toReplyResponse(review.reply) : undefined,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }

  private toReplyResponse(reply: any): VendorReplyResponse {
    return {
      id: reply.id,
      reviewId: reply.reviewId,
      body: reply.body,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
    };
  }
}
