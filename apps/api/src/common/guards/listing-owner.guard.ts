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
export class ListingOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Admins bypass ownership check
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const listingId = request.params.id;
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: { vendorId: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.vendorId !== user.vendorId) {
      throw new ForbiddenException('You do not own this listing');
    }

    return true;
  }
}
