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
export class InvoiceOwnerGuard implements CanActivate {
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

    const invoiceId = request.params.id;
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId },
      select: { vendorId: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (!user.vendorId || invoice.vendorId !== user.vendorId) {
      throw new ForbiddenException('You do not own this invoice');
    }

    return true;
  }
}
