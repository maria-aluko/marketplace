import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ReviewsService } from '../reviews/reviews.service';
import { DISPUTE_RAISE_WINDOW_HOURS, DISPUTE_APPEAL_WINDOW_HOURS } from '@eventtrust/shared';
import type {
  CreateDisputePayload,
  DisputeDecisionPayload,
  DisputeAppealPayload,
  DisputeResponse,
  PaginatedResponse,
} from '@eventtrust/shared';

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly reviewsService: ReviewsService,
  ) {}

  async create(
    vendorId: string,
    actorId: string,
    data: CreateDisputePayload,
  ): Promise<DisputeResponse> {
    const review = await this.prisma.review.findFirst({
      where: { id: data.reviewId, deletedAt: null },
      select: { id: true, vendorId: true, status: true, updatedAt: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.vendorId !== vendorId) {
      throw new ForbiddenException('This review does not belong to your vendor profile');
    }

    if (review.status !== 'APPROVED') {
      throw new BadRequestException('Only approved reviews can be disputed');
    }

    // 72-hour window check
    const windowMs = DISPUTE_RAISE_WINDOW_HOURS * 60 * 60 * 1000;
    if (Date.now() - review.updatedAt.getTime() > windowMs) {
      throw new BadRequestException(
        `Disputes must be raised within ${DISPUTE_RAISE_WINDOW_HOURS} hours of review approval`,
      );
    }

    // No existing dispute on this review
    const existing = await this.prisma.dispute.findUnique({
      where: { reviewId: data.reviewId },
    });
    if (existing) {
      throw new BadRequestException('A dispute already exists for this review');
    }

    const dispute = await this.prisma.dispute.create({
      data: {
        reviewId: data.reviewId,
        vendorId,
        reason: data.reason,
        status: 'OPEN',
      },
    });

    await this.auditService.log({
      action: 'dispute.created',
      actorId,
      targetType: 'Dispute',
      targetId: dispute.id,
      metadata: { vendorId, reviewId: data.reviewId },
    });

    return this.toResponse(dispute);
  }

  async findByVendor(vendorId: string): Promise<DisputeResponse[]> {
    const disputes = await this.prisma.dispute.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
    return disputes.map((d) => this.toResponse(d));
  }

  async findPending(
    cursor?: string,
    limit: number = 20,
  ): Promise<PaginatedResponse<DisputeResponse>> {
    const where: any = { status: { in: ['OPEN', 'APPEALED'] } };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const [disputes, total] = await Promise.all([
      this.prisma.dispute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'APPEALED'] } } }),
    ]);

    const hasMore = disputes.length > limit;
    const items = hasMore ? disputes.slice(0, limit) : disputes;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : undefined;

    return {
      data: items.map((d) => this.toResponse(d)),
      nextCursor,
      total,
    };
  }

  async decide(
    disputeId: string,
    adminId: string,
    data: DisputeDecisionPayload,
  ): Promise<DisputeResponse> {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== 'OPEN') {
      throw new BadRequestException('Only OPEN disputes can be decided');
    }

    if (data.removeReview) {
      await this.reviewsService.remove(
        dispute.reviewId,
        adminId,
        'Dispute resolved — review removed',
      );
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'DECIDED',
        adminDecision: data.decision,
        policyClause: data.policyClause,
      },
    });

    await this.auditService.log({
      action: 'dispute.decided',
      actorId: adminId,
      targetType: 'Dispute',
      targetId: disputeId,
      metadata: { removeReview: data.removeReview, policyClause: data.policyClause },
    });

    return this.toResponse(updated);
  }

  async appeal(
    disputeId: string,
    vendorId: string,
    actorId: string,
    data: DisputeAppealPayload,
  ): Promise<DisputeResponse> {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.vendorId !== vendorId) {
      throw new ForbiddenException('You do not own this dispute');
    }

    if (dispute.status !== 'DECIDED') {
      throw new BadRequestException('Only DECIDED disputes can be appealed');
    }

    // 48-hour appeal window
    const windowMs = DISPUTE_APPEAL_WINDOW_HOURS * 60 * 60 * 1000;
    if (Date.now() - dispute.updatedAt.getTime() > windowMs) {
      throw new BadRequestException(
        `Appeals must be submitted within ${DISPUTE_APPEAL_WINDOW_HOURS} hours of the decision`,
      );
    }

    // No prior appeal
    if (dispute.appealReason) {
      throw new BadRequestException('This dispute has already been appealed');
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'APPEALED',
        appealReason: data.reason,
      },
    });

    await this.auditService.log({
      action: 'dispute.appealed',
      actorId,
      targetType: 'Dispute',
      targetId: disputeId,
      metadata: { vendorId },
    });

    return this.toResponse(updated);
  }

  async close(disputeId: string, adminId: string): Promise<DisputeResponse> {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.status !== 'APPEALED') {
      throw new BadRequestException('Only APPEALED disputes can be closed');
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status: 'CLOSED' },
    });

    await this.auditService.log({
      action: 'dispute.closed',
      actorId: adminId,
      targetType: 'Dispute',
      targetId: disputeId,
      metadata: {},
    });

    return this.toResponse(updated);
  }

  toResponse(dispute: any): DisputeResponse {
    return {
      id: dispute.id,
      reviewId: dispute.reviewId,
      vendorId: dispute.vendorId,
      reason: dispute.reason,
      status: dispute.status.toLowerCase() as any,
      adminDecision: dispute.adminDecision ?? undefined,
      policyClause: dispute.policyClause ?? undefined,
      appealReason: dispute.appealReason ?? undefined,
      createdAt: dispute.createdAt.toISOString(),
      updatedAt: dispute.updatedAt.toISOString(),
    };
  }
}
