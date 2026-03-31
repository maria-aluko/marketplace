import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { VendorAvailabilityResponse, BlockDatePayload } from '@eventtrust/shared';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(
    vendorId: string,
    from?: string,
    to?: string,
  ): Promise<VendorAvailabilityResponse[]> {
    const where: any = { vendorId };

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const records = await this.prisma.vendorAvailability.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    return records.map((r) => this.toResponse(r));
  }

  async blockDate(vendorId: string, data: BlockDatePayload): Promise<VendorAvailabilityResponse> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: { id: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    // Upsert — idempotent if date already blocked
    const record = await this.prisma.vendorAvailability.upsert({
      where: { vendorId_date: { vendorId, date: new Date(data.date) } },
      create: { vendorId, date: new Date(data.date), reason: data.reason },
      update: { reason: data.reason },
    });

    return this.toResponse(record);
  }

  async unblockDate(vendorId: string, date: string): Promise<void> {
    const record = await this.prisma.vendorAvailability.findUnique({
      where: { vendorId_date: { vendorId, date: new Date(date) } },
    });

    if (!record) {
      throw new NotFoundException('Blocked date not found');
    }

    await this.prisma.vendorAvailability.delete({
      where: { vendorId_date: { vendorId, date: new Date(date) } },
    });
  }

  private toResponse(record: any): VendorAvailabilityResponse {
    return {
      id: record.id,
      vendorId: record.vendorId,
      date: record.date instanceof Date
        ? record.date.toISOString().split('T')[0]!
        : String(record.date),
      reason: record.reason ?? undefined,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
