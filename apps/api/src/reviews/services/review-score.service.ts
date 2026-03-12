import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewScoreService {
  constructor(private readonly prisma: PrismaService) {}

  async recalculate(vendorId: string): Promise<{ avgRating: number; reviewCount: number }> {
    const aggregate = await this.prisma.review.aggregate({
      where: {
        vendorId,
        status: 'APPROVED',
        deletedAt: null,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const avgRating = aggregate._avg.rating ?? 0;
    const reviewCount = aggregate._count.rating;

    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { avgRating, reviewCount },
    });

    return { avgRating, reviewCount };
  }
}
