import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VendorStatusService } from './services/vendor-status.service';
import {
  VendorStatus,
  SubscriptionTier,
  SLUG_MAX_LENGTH,
} from '@eventtrust/shared';
import type { CreateVendorPayload, UpdateVendorPayload, VendorResponse } from '@eventtrust/shared';
import * as crypto from 'crypto';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly vendorStatusService: VendorStatusService,
  ) {}

  async create(userId: string, data: CreateVendorPayload): Promise<VendorResponse> {
    const [existing, user] = await Promise.all([
      this.prisma.vendor.findFirst({ where: { userId, deletedAt: null } }),
      this.prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { phone: true } }),
    ]);
    if (existing) {
      throw new BadRequestException('You already have a vendor profile');
    }

    const slug = await this.generateSlug(data.businessName);

    const stripHtml = (s: string) => sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} });
    const vendor = await this.prisma.vendor.create({
      data: {
        userId,
        slug,
        businessName: stripHtml(data.businessName),
        category: data.category.toUpperCase() as any,
        description: data.description ? stripHtml(data.description) : data.description,
        area: data.area,
        address: data.address,
        priceFrom: data.priceFrom,
        priceTo: data.priceTo,
        whatsappNumber: data.whatsappNumber ?? user?.phone,
        instagramHandle: data.instagramHandle,
        primaryRentalCategory: data.primaryRentalCategory
          ? (data.primaryRentalCategory.toUpperCase() as any)
          : undefined,
        profileCompleteScore: this.calculateProfileCompleteness(data),
      },
    });

    // Update user role to VENDOR
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'VENDOR' as any },
    });

    await this.auditService.log({
      action: 'vendor.created',
      actorId: userId,
      targetType: 'Vendor',
      targetId: vendor.id,
    });

    return this.toResponse(vendor);
  }

  async update(vendorId: string, actorId: string, data: UpdateVendorPayload): Promise<VendorResponse> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const stripHtml = (s: string) => sanitizeHtml(s, { allowedTags: [], allowedAttributes: {} });
    const updateData: Record<string, any> = {};
    if (data.businessName !== undefined) updateData.businessName = stripHtml(data.businessName);
    if (data.category !== undefined) updateData.category = data.category.toUpperCase();
    if (data.description !== undefined) updateData.description = stripHtml(data.description);
    if (data.area !== undefined) updateData.area = data.area;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.priceFrom !== undefined) updateData.priceFrom = data.priceFrom;
    if (data.priceTo !== undefined) updateData.priceTo = data.priceTo;
    if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber;
    if (data.instagramHandle !== undefined) updateData.instagramHandle = data.instagramHandle;
    if (data.primaryRentalCategory !== undefined)
      updateData.primaryRentalCategory = data.primaryRentalCategory.toUpperCase();

    const merged = { ...vendor, ...data };
    updateData.profileCompleteScore = this.calculateProfileCompleteness({
      businessName: merged.businessName,
      category: merged.category as any,
      description: merged.description,
      area: merged.area,
      address: merged.address ?? undefined,
      priceFrom: merged.priceFrom ? Number(merged.priceFrom) : undefined,
      priceTo: merged.priceTo ? Number(merged.priceTo) : undefined,
      whatsappNumber: merged.whatsappNumber ?? undefined,
      instagramHandle: merged.instagramHandle ?? undefined,
    });

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: updateData,
    });

    await this.auditService.log({
      action: 'vendor.updated',
      actorId,
      targetType: 'Vendor',
      targetId: vendorId,
      metadata: { fields: Object.keys(updateData).filter(k => k !== 'profileCompleteScore') },
    });

    return this.toResponse(updated);
  }

  async submitForReview(vendorId: string, actorId: string): Promise<VendorResponse> {
    const vendor = await this.vendorStatusService.transition(
      vendorId,
      VendorStatus.PENDING,
      actorId,
    );
    return this.toResponse(vendor);
  }

  async findById(vendorId: string): Promise<VendorResponse | null> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
    });
    return vendor ? this.toResponse(vendor) : null;
  }

  async findBySlug(slug: string): Promise<VendorResponse | null> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { slug, deletedAt: null },
    });
    return vendor ? this.toResponse(vendor) : null;
  }

  async updateSubscriptionTier(vendorId: string, tier: SubscriptionTier, actorId: string): Promise<VendorResponse> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const oldTier = vendor.subscriptionTier;

    const updated = await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { subscriptionTier: tier.toUpperCase() as any },
    });

    await this.auditService.log({
      action: 'vendor.subscription_changed',
      actorId,
      targetType: 'Vendor',
      targetId: vendorId,
      metadata: { oldTier, newTier: tier },
    });

    return this.toResponse(updated);
  }

  calculateProfileCompleteness(data: Partial<CreateVendorPayload>): number {
    const fields = [
      data.businessName,
      data.category,
      data.description,
      data.area,
      data.address,
      data.priceFrom,
      data.priceTo,
      data.whatsappNumber,
      data.instagramHandle,
    ];
    const filled = fields.filter((f) => f !== undefined && f !== null && f !== '').length;
    return Math.round((filled / fields.length) * 100) / 100;
  }

  private async generateSlug(businessName: string): Promise<string> {
    let slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, SLUG_MAX_LENGTH - 5);

    const existing = await this.prisma.vendor.findFirst({ where: { slug } });
    if (existing) {
      const suffix = crypto.randomBytes(2).toString('hex');
      slug = `${slug}-${suffix}`.slice(0, SLUG_MAX_LENGTH);
    }

    return slug;
  }

  toResponse(vendor: any): VendorResponse {
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
      primaryRentalCategory: vendor.primaryRentalCategory
        ? (vendor.primaryRentalCategory.toLowerCase() as any)
        : undefined,
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
