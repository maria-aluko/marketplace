import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogParams {
  action: string;
  actorId: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    await this.prisma.adminLog.create({
      data: {
        adminId: params.actorId,
        action: params.action,
        entityType: params.targetType,
        entityId: params.targetId,
        details: params.metadata ? (params.metadata as any) : undefined,
      },
    });
  }
}
