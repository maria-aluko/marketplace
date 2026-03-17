import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VALID_INQUIRY_STATUS_TRANSITIONS } from '@eventtrust/shared';
import type {
  CreateInquiryPayload,
  UpdateInquiryStatusPayload,
  InquiryResponse,
} from '@eventtrust/shared';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(clientId: string, data: CreateInquiryPayload): Promise<InquiryResponse> {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        clientId,
        vendorId: data.vendorId,
        listingId: data.listingId ?? null,
        source: data.source as any,
        message: data.message ?? null,
        status: 'NEW',
      },
    });

    // Fire-and-forget audit — never throws
    this.auditService
      .log({
        action: 'inquiry.created',
        actorId: clientId,
        targetType: 'Inquiry',
        targetId: inquiry.id,
        metadata: { vendorId: data.vendorId, source: data.source },
      })
      .catch(() => {});

    return this.toResponse(inquiry);
  }

  async findByClient(clientId: string): Promise<InquiryResponse[]> {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
    return inquiries.map((i: any) => this.toResponse(i));
  }

  async findByVendor(vendorId: string): Promise<InquiryResponse[]> {
    const inquiries = await this.prisma.inquiry.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            phone: true,
            clientProfile: { select: { displayName: true } },
          },
        },
        listing: { select: { title: true } },
      },
    });
    return inquiries.map((i: any) => this.toResponse(i));
  }

  async updateStatus(
    inquiryId: string,
    actorId: string,
    data: UpdateInquiryStatusPayload,
  ): Promise<InquiryResponse> {
    const inquiry = await this.prisma.inquiry.findFirst({
      where: { id: inquiryId },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    const currentStatus = inquiry.status as string;
    const allowed = VALID_INQUIRY_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(data.status)) {
      throw new BadRequestException(
        `Cannot transition inquiry from ${currentStatus} to ${data.status}`,
      );
    }

    const updated = await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        status: data.status as any,
        notes: data.notes ?? undefined,
      },
    });

    await this.auditService.log({
      action: 'inquiry.status_changed',
      actorId,
      targetType: 'Inquiry',
      targetId: inquiryId,
      metadata: { oldStatus: currentStatus, newStatus: data.status },
    });

    return this.toResponse(updated);
  }

  // Called internally by InvoicesService — skips transition validation
  async internalUpdateStatus(inquiryId: string, status: string): Promise<void> {
    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status: status as any },
    });
  }

  // Called internally to link an invoice to an inquiry
  async linkInvoice(inquiryId: string, invoiceId: string): Promise<void> {
    await this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { invoiceId },
    });
  }

  toResponse(inquiry: any): InquiryResponse {
    return {
      id: inquiry.id,
      clientId: inquiry.clientId,
      vendorId: inquiry.vendorId,
      listingId: inquiry.listingId ?? undefined,
      source: inquiry.source,
      message: inquiry.message ?? undefined,
      notes: inquiry.notes ?? undefined,
      status: inquiry.status,
      invoiceId: inquiry.invoiceId ?? undefined,
      clientPhone: inquiry.client?.phone ?? undefined,
      clientName: inquiry.client?.clientProfile?.displayName ?? undefined,
      listingTitle: inquiry.listing?.title ?? undefined,
      createdAt: inquiry.createdAt.toISOString(),
      updatedAt: inquiry.updatedAt.toISOString(),
    };
  }
}
