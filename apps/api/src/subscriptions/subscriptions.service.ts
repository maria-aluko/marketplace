import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SUBSCRIPTION_TIER_LIMITS } from '@eventtrust/shared';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async enforceListingLimit(vendorId: string): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: { subscriptionTier: true },
    });

    if (!vendor) return;

    const tier = vendor.subscriptionTier.toLowerCase() as keyof typeof SUBSCRIPTION_TIER_LIMITS;
    const limit = SUBSCRIPTION_TIER_LIMITS[tier]?.listings ?? 1;

    if (limit === Infinity) return;

    const count = await this.prisma.listing.count({
      where: { vendorId, deletedAt: null },
    });

    if (count >= limit) {
      throw new ForbiddenException(
        `Your ${tier} plan allows a maximum of ${limit} listing${limit === 1 ? '' : 's'}. Upgrade to create more.`,
      );
    }
  }

  async enforcePhotoLimit(vendorId: string, currentPhotoCount: number): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: { subscriptionTier: true },
    });

    if (!vendor) return;

    const tier = vendor.subscriptionTier.toLowerCase() as keyof typeof SUBSCRIPTION_TIER_LIMITS;
    const limit = SUBSCRIPTION_TIER_LIMITS[tier]?.photosPerListing ?? 3;

    if (limit === Infinity) return;

    if (currentPhotoCount >= limit) {
      throw new ForbiddenException(
        `Your ${tier} plan allows a maximum of ${limit} portfolio photos. Upgrade to upload more.`,
      );
    }
  }
}
