import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { VALID_STATUS_TRANSITIONS, VendorStatus } from '@eventtrust/shared';

@Injectable()
export class VendorStatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async transition(
    vendorId: string,
    newStatus: VendorStatus,
    actorId: string,
    reason?: string,
  ) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
    });

    if (!vendor) {
      throw new BadRequestException('Vendor not found');
    }

    const currentStatus = vendor.status.toLowerCase();
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from '${currentStatus}' to '${newStatus}'`,
      );
    }

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { status: newStatus.toUpperCase() as any },
    });

    await this.auditService.log({
      action: 'vendor.status_change',
      actorId,
      targetType: 'Vendor',
      targetId: vendorId,
      metadata: {
        oldStatus: currentStatus,
        newStatus,
        reason,
      },
    });

    return updated;
  }
}
