import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@eventtrust/shared';

@Injectable()
export class DisputeOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const disputeId = request.params.id;
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { vendorId: true },
    });

    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }

    if (dispute.vendorId !== user.vendorId) {
      throw new ForbiddenException('You do not own this dispute');
    }

    return true;
  }
}
