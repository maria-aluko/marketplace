import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { VendorStatusService } from './services/vendor-status.service';
import {
  VendorStatus,
  UserRole,
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
    // Check if user already has a vendor
    const existing = await this.prisma.vendor.findFirst({
      where: { userId, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException('You already have a vendor profile');
    }

    const slug = await this.generateSlug(data.businessName);

    const vendor = await this.prisma.vendor.create({
      data: {
        userId,
        slug,
        businessName: data.businessName,
        category: data.category.toUpperCase() as any,
        description: data.description,
        area: data.area,
        address: data.address,
        priceFrom: data.priceFrom,
        priceTo: data.priceTo,
        whatsappNumber: data.whatsappNumber,
        instagramHandle: data.instagramHandle,
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

  async update(vendorId: string, data: UpdateVendorPayload): Promise<VendorResponse> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const updateData: Record<string, any> = {};
    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.category !== undefined) updateData.category = data.category.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.area !== undefined) updateData.area = data.area;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.priceFrom !== undefined) updateData.priceFrom = data.priceFrom;
    if (data.priceTo !== undefined) updateData.priceTo = data.priceTo;
    if (data.whatsappNumber !== undefined) updateData.whatsappNumber = data.whatsappNumber;
    if (data.instagramHandle !== undefined) updateData.instagramHandle = data.instagramHandle;

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

  private toResponse(vendor: any): VendorResponse {
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
      createdAt: vendor.createdAt.toISOString(),
      updatedAt: vendor.updatedAt.toISOString(),
    };
  }
}
