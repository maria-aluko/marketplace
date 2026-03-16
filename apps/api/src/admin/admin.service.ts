import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewsService } from '../reviews/reviews.service';
import type {
  AdminAnalytics,
  PaginatedResponse,
  VendorResponse,
  ReviewResponse,
} from '@eventtrust/shared';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewsService: ReviewsService,
  ) {}

  async getAnalytics(): Promise<AdminAnalytics> {
    const [
      totalVendors,
      activeVendors,
      pendingVendors,
      totalReviews,
      pendingReviews,
      openDisputes,
      totalClients,
    ] = await Promise.all([
      this.prisma.vendor.count({ where: { deletedAt: null } }),
      this.prisma.vendor.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      this.prisma.vendor.count({ where: { status: 'PENDING', deletedAt: null } }),
      this.prisma.review.count({ where: { deletedAt: null } }),
      this.prisma.review.count({ where: { status: 'PENDING', deletedAt: null } }),
      this.prisma.dispute.count({ where: { status: 'OPEN' } }),
      this.prisma.user.count({ where: { role: 'CLIENT', deletedAt: null } }),
    ]);

    return {
      totalVendors,
      activeVendors,
      pendingVendors,
      totalReviews,
      pendingReviews,
      openDisputes,
      totalClients,
    };
  }

  async getPendingVendors(
    cursor?: string,
    limit: number = 20,
  ): Promise<PaginatedResponse<VendorResponse>> {
    const where: any = { status: 'PENDING', deletedAt: null };

    if (cursor) {
      where.id = { lt: cursor };
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      }),
      this.prisma.vendor.count({ where: { status: 'PENDING', deletedAt: null } }),
    ]);

    const hasMore = vendors.length > limit;
    const items = hasMore ? vendors.slice(0, limit) : vendors;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : undefined;

    return {
      data: items.map((v: any) => this.toVendorResponse(v)),
      nextCursor,
      total,
    };
  }

  async getPendingReviews(
    cursor?: string,
    limit: number = 20,
  ): Promise<PaginatedResponse<ReviewResponse>> {
    return this.reviewsService.findPending(cursor, limit);
  }

  async approveReview(reviewId: string, adminId: string): Promise<ReviewResponse> {
    return this.reviewsService.approve(reviewId, adminId);
  }

  async rejectReview(
    reviewId: string,
    adminId: string,
    reason: string,
  ): Promise<ReviewResponse> {
    return this.reviewsService.reject(reviewId, adminId, reason);
  }

  async removeReview(reviewId: string, adminId: string, reason: string): Promise<void> {
    return this.reviewsService.remove(reviewId, adminId, reason);
  }

  private toVendorResponse(vendor: any): VendorResponse {
    return {
      id: vendor.id,
      slug: vendor.slug,
      businessName: vendor.businessName,
      category: vendor.category.toLowerCase() as any,
      description: vendor.description,
      area: vendor.area,
      address: vendor.address ?? undefined,
      priceFrom: vendor.priceFrom ? Number(vendor.priceFrom) : undefined,
      priceTo: vendor.priceTo ? Number(vendor.priceTo) : undefined,
      whatsappNumber: vendor.whatsappNumber ?? undefined,
      instagramHandle: vendor.instagramHandle ?? undefined,
      status: vendor.status.toLowerCase() as any,
      avgRating: vendor.avgRating,
      reviewCount: vendor.reviewCount,
      profileCompleteScore: vendor.profileCompleteScore,
      coverImageUrl: vendor.coverImageUrl ?? undefined,
      userId: vendor.userId,
      subscriptionTier: (vendor.subscriptionTier ?? 'FREE').toLowerCase() as any,
      createdAt: vendor.createdAt.toISOString(),
      updatedAt: vendor.updatedAt.toISOString(),
    };
  }
}
