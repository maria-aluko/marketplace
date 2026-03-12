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
export class ReviewOwnerGuard implements CanActivate {
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

    const reviewId = request.params.reviewId;
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
      select: { vendorId: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.vendorId !== user.vendorId) {
      throw new ForbiddenException('You do not own this review');
    }

    return true;
  }
}
