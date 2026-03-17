import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InquiriesService } from '../inquiries/inquiries.service';
import { VALID_INVOICE_STATUS_TRANSITIONS, INVOICE_NUMBER_PREFIX } from '@eventtrust/shared';
import type {
  CreateInvoicePayload,
  UpdateInvoicePayload,
  InvoiceResponse,
  InvoiceSummaryResponse,
  InvoiceItemResponse,
  VendorFunnelResponse,
} from '@eventtrust/shared';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly inquiriesService: InquiriesService,
  ) {}

  async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${INVOICE_NUMBER_PREFIX}-${year}-`;
    const count = await this.prisma.invoice.count({
      where: { invoiceNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  async create(vendorId: string, actorId: string, data: CreateInvoicePayload): Promise<InvoiceResponse> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Validate inquiry ownership if provided and capture clientId
    let linkedClientId: string | null = null;
    if (data.inquiryId) {
      const inquiry = await this.prisma.inquiry.findFirst({
        where: { id: data.inquiryId, vendorId },
      });
      if (!inquiry) {
        throw new BadRequestException('Inquiry not found or does not belong to this vendor');
      }
      linkedClientId = inquiry.clientId ?? null;
    }

    const invoiceNumber = await this.generateInvoiceNumber();
    const subtotalKobo = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceKobo,
      0,
    );
    const discountKobo = data.discountKobo ?? 0;
    const totalKobo = Math.max(0, subtotalKobo - discountKobo);

    const invoice = await this.prisma.invoice.create({
      data: {
        vendorId,
        clientId: linkedClientId,
        invoiceNumber,
        clientName: data.clientName,
        clientPhone: data.clientPhone ?? null,
        clientEmail: data.clientEmail ?? null,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        eventLocation: data.eventLocation ?? null,
        notes: data.notes ?? null,
        subtotalKobo,
        discountKobo,
        totalKobo,
        items: {
          create: data.items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unitPriceKobo: item.unitPriceKobo,
            totalKobo: item.quantity * item.unitPriceKobo,
            sortOrder: item.sortOrder ?? idx,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    // Link to inquiry if provided
    if (data.inquiryId) {
      await this.inquiriesService.linkInvoice(data.inquiryId, invoice.id);
    }

    await this.auditService.log({
      action: 'invoice.created',
      actorId,
      targetType: 'Invoice',
      targetId: invoice.id,
      metadata: { vendorId, invoiceNumber, totalKobo },
    });

    return this.toResponse(invoice);
  }

  async findById(invoiceId: string, markViewed = false): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        vendor: { include: { invoiceBranding: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Auto-mark as viewed when status is SENT
    if (markViewed && invoice.status === 'SENT') {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'VIEWED', viewedAt: new Date() },
      });
      invoice.status = 'VIEWED' as any;
      invoice.viewedAt = new Date();
    }

    return this.toResponse(invoice);
  }

  async update(
    invoiceId: string,
    actorId: string,
    data: UpdateInvoicePayload,
  ): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'DRAFT') {
      throw new BadRequestException('Only draft invoices can be updated');
    }

    const updateData: Record<string, any> = {};
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.clientPhone !== undefined) updateData.clientPhone = data.clientPhone;
    if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail;
    if (data.eventDate !== undefined) updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    if (data.eventLocation !== undefined) updateData.eventLocation = data.eventLocation;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.discountKobo !== undefined) updateData.discountKobo = data.discountKobo;

    if (data.items !== undefined) {
      // Replace all items
      await this.prisma.invoiceItem.deleteMany({ where: { invoiceId } });
      const subtotalKobo = data.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceKobo,
        0,
      );
      const discountKobo = data.discountKobo ?? invoice.discountKobo;
      updateData.subtotalKobo = subtotalKobo;
      updateData.totalKobo = Math.max(0, subtotalKobo - discountKobo);

      const updated = await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          ...updateData,
          items: {
            create: data.items.map((item, idx) => ({
              description: item.description,
              quantity: item.quantity,
              unitPriceKobo: item.unitPriceKobo,
              totalKobo: item.quantity * item.unitPriceKobo,
              sortOrder: item.sortOrder ?? idx,
            })),
          },
        },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });

      await this.auditService.log({
        action: 'invoice.updated',
        actorId,
        targetType: 'Invoice',
        targetId: invoiceId,
        metadata: { fields: Object.keys(data) },
      });

      return this.toResponse(updated);
    }

    // Recalculate total if discount changed
    if (data.discountKobo !== undefined) {
      updateData.totalKobo = Math.max(0, invoice.subtotalKobo - data.discountKobo);
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.auditService.log({
      action: 'invoice.updated',
      actorId,
      targetType: 'Invoice',
      targetId: invoiceId,
      metadata: { fields: Object.keys(data) },
    });

    return this.toResponse(updated);
  }

  async send(invoiceId: string, actorId: string): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId } });

    if (!invoice) throw new NotFoundException('Invoice not found');

    const allowed = VALID_INVOICE_STATUS_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes('SENT')) {
      throw new BadRequestException(`Cannot send invoice in status ${invoice.status}`);
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'SENT', sentAt: new Date() },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.auditService.log({
      action: 'invoice.sent',
      actorId,
      targetType: 'Invoice',
      targetId: invoiceId,
      metadata: {},
    });

    return this.toResponse(updated);
  }

  async confirm(invoiceId: string): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId },
      include: { inquiry: { select: { id: true } } },
    });

    if (!invoice) throw new NotFoundException('Invoice not found');

    if (!['SENT', 'VIEWED'].includes(invoice.status)) {
      throw new BadRequestException('Invoice must be sent or viewed before it can be confirmed');
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    // Update linked inquiry to BOOKED
    const inquiry = (invoice as any).inquiry;
    if (inquiry) {
      await this.inquiriesService.internalUpdateStatus(inquiry.id, 'BOOKED');
    }

    await this.auditService.log({
      action: 'invoice.confirmed',
      actorId: invoice.vendorId,
      targetType: 'Invoice',
      targetId: invoiceId,
      metadata: {},
    });

    return this.toResponse(updated);
  }

  async complete(invoiceId: string, actorId: string, userVendorId?: string): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId } });

    if (!invoice) throw new NotFoundException('Invoice not found');

    // Must be vendor owner or linked client
    if (userVendorId && invoice.vendorId !== userVendorId) {
      if (invoice.clientId !== actorId) {
        throw new ForbiddenException('Access denied');
      }
    }

    const allowed = VALID_INVOICE_STATUS_TRANSITIONS[invoice.status] ?? [];
    if (!allowed.includes('COMPLETED')) {
      throw new BadRequestException(`Cannot complete invoice in status ${invoice.status}`);
    }

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'COMPLETED', completedAt: new Date() },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.auditService.log({
      action: 'invoice.completed',
      actorId,
      targetType: 'Invoice',
      targetId: invoiceId,
      metadata: {},
    });

    return this.toResponse(updated);
  }

  async findByVendor(vendorId: string): Promise<InvoiceSummaryResponse[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
    return invoices.map((i: any) => this.toSummaryResponse(i));
  }

  async findByClient(
    clientId: string,
    vendorId?: string,
    statuses?: string[],
  ): Promise<InvoiceSummaryResponse[]> {
    const where: any = { clientId };
    if (vendorId) where.vendorId = vendorId;
    if (statuses && statuses.length > 0) where.status = { in: statuses };

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { vendor: { select: { businessName: true } } },
    });
    return invoices.map((i: any) => this.toSummaryResponse(i));
  }

  async findByClientAndId(clientId: string, invoiceId: string): Promise<InvoiceResponse | null> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, clientId },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        vendor: { include: { invoiceBranding: true } },
      },
    });

    return invoice ? this.toResponse(invoice) : null;
  }

  async getFunnel(vendorId: string): Promise<VendorFunnelResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [inquiriesThisMonth, invoicesSentThisMonth, confirmedBookingsThisMonth, completedThisMonth] =
      await Promise.all([
        this.prisma.inquiry.count({
          where: { vendorId, createdAt: { gte: startOfMonth, lt: endOfMonth } },
        }),
        this.prisma.invoice.count({
          where: {
            vendorId,
            sentAt: { gte: startOfMonth, lt: endOfMonth },
            status: { not: 'CANCELLED' },
          },
        }),
        this.prisma.invoice.count({
          where: {
            vendorId,
            confirmedAt: { gte: startOfMonth, lt: endOfMonth },
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          },
        }),
        this.prisma.invoice.count({
          where: {
            vendorId,
            completedAt: { gte: startOfMonth, lt: endOfMonth },
            status: 'COMPLETED',
          },
        }),
      ]);

    return {
      inquiriesThisMonth,
      invoicesSentThisMonth,
      confirmedBookingsThisMonth,
      completedThisMonth,
    };
  }

  toResponse(invoice: any): InvoiceResponse {
    const branding = invoice.vendor?.invoiceBranding;
    return {
      id: invoice.id,
      vendorId: invoice.vendorId,
      clientId: invoice.clientId ?? undefined,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      clientName: invoice.clientName,
      clientPhone: invoice.clientPhone ?? undefined,
      clientEmail: invoice.clientEmail ?? undefined,
      eventDate: invoice.eventDate?.toISOString().split('T')[0] ?? undefined,
      eventLocation: invoice.eventLocation ?? undefined,
      notes: invoice.notes ?? undefined,
      subtotalKobo: invoice.subtotalKobo,
      discountKobo: invoice.discountKobo,
      totalKobo: invoice.totalKobo,
      sentAt: invoice.sentAt?.toISOString() ?? undefined,
      viewedAt: invoice.viewedAt?.toISOString() ?? undefined,
      confirmedAt: invoice.confirmedAt?.toISOString() ?? undefined,
      completedAt: invoice.completedAt?.toISOString() ?? undefined,
      items: (invoice.items ?? []).map((item: any) => this.toItemResponse(item)),
      branding: branding
        ? {
            logoUrl: branding.logoUrl ?? undefined,
            accentColor: branding.accentColor,
            tagline: branding.tagline ?? undefined,
            footerText: branding.footerText ?? undefined,
          }
        : undefined,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }

  private toSummaryResponse(invoice: any): InvoiceSummaryResponse {
    return {
      id: invoice.id,
      vendorId: invoice.vendorId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      clientName: invoice.clientName,
      eventDate: invoice.eventDate?.toISOString().split('T')[0] ?? undefined,
      totalKobo: invoice.totalKobo,
      confirmedAt: invoice.confirmedAt?.toISOString() ?? undefined,
      createdAt: invoice.createdAt.toISOString(),
      vendorName: invoice.vendor?.businessName ?? undefined,
    };
  }

  private toItemResponse(item: any): InvoiceItemResponse {
    return {
      id: item.id,
      invoiceId: item.invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPriceKobo: item.unitPriceKobo,
      totalKobo: item.totalKobo,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt.toISOString(),
    };
  }
}
