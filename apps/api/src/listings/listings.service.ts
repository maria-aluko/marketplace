import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  CreateServiceListingPayload,
  CreateRentalListingPayload,
  UpdateServiceListingPayload,
  UpdateRentalListingPayload,
  ListingResponse,
} from '@eventtrust/shared';

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createServiceListing(
    vendorId: string,
    actorId: string,
    data: CreateServiceListingPayload,
  ): Promise<ListingResponse> {
    await this.ensureVendorActive(vendorId);

    const listing = await this.prisma.listing.create({
      data: {
        vendorId,
        listingType: 'SERVICE',
        title: data.title,
        description: data.description,
        category: data.category.toUpperCase() as any,
        priceFrom: data.priceFrom,
        priceTo: data.priceTo,
        photos: data.photos ?? [],
      },
    });

    await this.auditService.log({
      action: 'listing.created',
      actorId,
      targetType: 'Listing',
      targetId: listing.id,
      metadata: { listingType: 'SERVICE', vendorId },
    });

    return this.toResponse(listing);
  }

  async createRentalListing(
    vendorId: string,
    actorId: string,
    data: CreateRentalListingPayload,
  ): Promise<ListingResponse> {
    await this.ensureVendorActive(vendorId);

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const listing = await tx.listing.create({
        data: {
          vendorId,
          listingType: 'RENTAL',
          title: data.title,
          description: data.description,
          photos: data.photos ?? [],
        },
      });

      const rentalDetails = await tx.listingRentalDetails.create({
        data: {
          listingId: listing.id,
          rentalCategory: data.rentalCategory.toUpperCase() as any,
          quantityAvailable: data.quantityAvailable,
          pricePerDay: data.pricePerDay,
          depositAmount: data.depositAmount,
          deliveryOption: data.deliveryOption.toUpperCase() as any,
          condition: data.condition ? (data.condition.toUpperCase() as any) : undefined,
        },
      });

      return { ...listing, rentalDetails };
    });

    await this.auditService.log({
      action: 'listing.created',
      actorId,
      targetType: 'Listing',
      targetId: result.id,
      metadata: { listingType: 'RENTAL', vendorId },
    });

    return this.toResponse(result);
  }

  async update(
    listingId: string,
    actorId: string,
    data: UpdateServiceListingPayload | UpdateRentalListingPayload,
  ): Promise<ListingResponse> {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      include: { rentalDetails: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const listingData: Record<string, any> = {};
    if ('title' in data && data.title !== undefined) listingData.title = data.title;
    if ('description' in data && data.description !== undefined)
      listingData.description = data.description;
    if ('photos' in data && data.photos !== undefined) listingData.photos = data.photos;

    if (listing.listingType === 'SERVICE') {
      const serviceData = data as UpdateServiceListingPayload;
      if (serviceData.category !== undefined)
        listingData.category = serviceData.category.toUpperCase();
      if (serviceData.priceFrom !== undefined) listingData.priceFrom = serviceData.priceFrom;
      if (serviceData.priceTo !== undefined) listingData.priceTo = serviceData.priceTo;
    }

    let updated: any;

    if (listing.listingType === 'RENTAL' && listing.rentalDetails) {
      const rentalData = data as UpdateRentalListingPayload;
      const rentalUpdateData: Record<string, any> = {};
      if (rentalData.rentalCategory !== undefined)
        rentalUpdateData.rentalCategory = rentalData.rentalCategory.toUpperCase();
      if (rentalData.quantityAvailable !== undefined)
        rentalUpdateData.quantityAvailable = rentalData.quantityAvailable;
      if (rentalData.pricePerDay !== undefined)
        rentalUpdateData.pricePerDay = rentalData.pricePerDay;
      if (rentalData.depositAmount !== undefined)
        rentalUpdateData.depositAmount = rentalData.depositAmount;
      if (rentalData.deliveryOption !== undefined)
        rentalUpdateData.deliveryOption = rentalData.deliveryOption.toUpperCase();
      if (rentalData.condition !== undefined)
        rentalUpdateData.condition = rentalData.condition
          ? rentalData.condition.toUpperCase()
          : null;

      updated = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const updatedListing = await tx.listing.update({
          where: { id: listingId },
          data: listingData,
        });

        if (Object.keys(rentalUpdateData).length > 0) {
          await tx.listingRentalDetails.update({
            where: { listingId },
            data: rentalUpdateData,
          });
        }

        return tx.listing.findFirst({
          where: { id: listingId },
          include: { rentalDetails: true },
        });
      });
    } else {
      updated = await this.prisma.listing.update({
        where: { id: listingId },
        data: listingData,
        include: { rentalDetails: true },
      });
    }

    await this.auditService.log({
      action: 'listing.updated',
      actorId,
      targetType: 'Listing',
      targetId: listingId,
      metadata: { fields: Object.keys(data).filter((k) => (data as any)[k] !== undefined) },
    });

    return this.toResponse(updated);
  }

  async softDelete(listingId: string, actorId: string): Promise<void> {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      action: 'listing.deleted',
      actorId,
      targetType: 'Listing',
      targetId: listingId,
      metadata: { vendorId: listing.vendorId },
    });
  }

  async findById(listingId: string): Promise<ListingResponse | null> {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      include: { rentalDetails: true },
    });

    return listing ? this.toResponse(listing) : null;
  }

  async findAll(): Promise<ListingResponse[]> {
    const listings = await this.prisma.listing.findMany({
      where: {
        deletedAt: null,
        vendor: { status: 'ACTIVE', deletedAt: null },
      },
      include: { rentalDetails: true },
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((l: any) => this.toResponse(l));
  }

  async findByVendorId(vendorId: string): Promise<ListingResponse[]> {
    const listings = await this.prisma.listing.findMany({
      where: { vendorId, deletedAt: null },
      include: { rentalDetails: true },
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((l: any) => this.toResponse(l));
  }

  toResponse(listing: any): ListingResponse {
    const response: ListingResponse = {
      id: listing.id,
      vendorId: listing.vendorId,
      listingType: listing.listingType.toLowerCase() as any,
      title: listing.title,
      description: listing.description,
      photos: listing.photos ?? [],
      avgRating: listing.avgRating ?? 0,
      reviewCount: listing.reviewCount ?? 0,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
    };

    if (listing.category) {
      response.category = listing.category.toLowerCase() as any;
    }
    if (listing.priceFrom !== null && listing.priceFrom !== undefined) {
      response.priceFrom = listing.priceFrom;
    }
    if (listing.priceTo !== null && listing.priceTo !== undefined) {
      response.priceTo = listing.priceTo;
    }

    if (listing.rentalDetails) {
      response.rentalDetails = {
        rentalCategory: listing.rentalDetails.rentalCategory.toLowerCase() as any,
        quantityAvailable: listing.rentalDetails.quantityAvailable,
        pricePerDay: listing.rentalDetails.pricePerDay,
        depositAmount: listing.rentalDetails.depositAmount ?? undefined,
        deliveryOption: listing.rentalDetails.deliveryOption.toLowerCase() as any,
        condition: listing.rentalDetails.condition
          ? (listing.rentalDetails.condition.toLowerCase() as any)
          : undefined,
      };
    }

    return response;
  }

  private async ensureVendorActive(vendorId: string): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: { status: true },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    if (vendor.status !== 'ACTIVE') {
      throw new ForbiddenException('Only active vendors can create listings');
    }
  }
}
