import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import type { CreateClientReviewPayload, ClientReviewResponse } from '@eventtrust/shared';

@Injectable()
export class ClientReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(vendorId: string, actorId: string, data: CreateClientReviewPayload): Promise<ClientReviewResponse> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: data.invoiceId },
      select: { id: true, vendorId: true, clientId: true, status: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.vendorId !== vendorId) {
      throw new ForbiddenException('Invoice does not belong to your vendor profile');
    }

    if (invoice.clientId !== data.clientId) {
      throw new BadRequestException('Client does not match the invoice');
    }

    const eligibleStatuses = ['CONFIRMED', 'COMPLETED'];
    if (!eligibleStatuses.includes(invoice.status)) {
      throw new BadRequestException('Invoice must be CONFIRMED or COMPLETED to rate the client');
    }

    // Self-review guard
    const vendorRecord = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: { userId: true },
    });
    if (vendorRecord?.userId === data.clientId) {
      throw new BadRequestException('Cannot review yourself');
    }

    // One review per invoice (unique enforced by DB, but give a clear error)
    const existing = await this.prisma.clientReview.findUnique({
      where: { invoiceId: data.invoiceId },
    });
    if (existing) {
      throw new BadRequestException('You have already rated this client for this invoice');
    }

    const review = await this.prisma.clientReview.create({
      data: {
        vendorId,
        clientId: data.clientId,
        invoiceId: data.invoiceId,
        rating: data.rating,
        body: data.body ?? null,
        status: 'PENDING',
      },
    });

    await this.auditService.log({
      action: 'client_review.created',
      actorId,
      targetType: 'ClientReview',
      targetId: review.id,
      metadata: { vendorId, clientId: data.clientId, rating: data.rating },
    });

    return this.toResponse(review);
  }

  async approve(reviewId: string, adminId: string): Promise<ClientReviewResponse> {
    const review = await this.prisma.clientReview.findUnique({ where: { id: reviewId } });

    if (!review) {
      throw new NotFoundException('Client review not found');
    }

    const updated = await this.prisma.clientReview.update({
      where: { id: reviewId },
      data: { status: 'APPROVED' },
    });

    await this.recalculateClientScore(review.clientId);

    await this.auditService.log({
      action: 'client_review.approved',
      actorId: adminId,
      targetType: 'ClientReview',
      targetId: reviewId,
      metadata: { clientId: review.clientId },
    });

    return this.toResponse(updated);
  }

  async recalculateClientScore(clientId: string): Promise<void> {
    const aggregate = await this.prisma.clientReview.aggregate({
      where: { clientId, status: 'APPROVED' },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.user.update({
      where: { id: clientId },
      data: {
        clientTrustScore: aggregate._avg.rating ?? 0,
        clientReviewCount: aggregate._count.rating,
      },
    });
  }

  async findPending(): Promise<ClientReviewResponse[]> {
    const reviews = await this.prisma.clientReview.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map((r) => this.toResponse(r));
  }

  toResponse(review: any): ClientReviewResponse {
    return {
      id: review.id,
      vendorId: review.vendorId,
      clientId: review.clientId,
      invoiceId: review.invoiceId,
      rating: review.rating,
      body: review.body ?? undefined,
      status: review.status.toLowerCase() as any,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }
}
