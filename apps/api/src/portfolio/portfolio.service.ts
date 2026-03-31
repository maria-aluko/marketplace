import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PORTFOLIO_MAX_IMAGES, PORTFOLIO_MAX_VIDEOS } from '@eventtrust/shared';
import type { PortfolioItem, SignedUploadResponse, ConfirmUploadPayload } from '@eventtrust/shared';
import { MediaType } from '@eventtrust/shared';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME', '');
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY', '');
    this.apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET', '');
  }

  async getSignedUploadUrl(vendorId: string): Promise<SignedUploadResponse> {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `eventtrust/vendors/${vendorId}/portfolio`;

    // Generate signature using SHA-1 (Cloudinary requirement)
    const crypto = await import('crypto');
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder,
    };
  }

  async confirmUpload(
    vendorId: string,
    actorId: string,
    data: ConfirmUploadPayload,
  ): Promise<PortfolioItem> {
    // Check limits
    const counts = await this.getMediaCounts(vendorId);

    if (data.mediaType === MediaType.IMAGE && counts.images >= PORTFOLIO_MAX_IMAGES) {
      throw new BadRequestException(`Maximum of ${PORTFOLIO_MAX_IMAGES} images allowed`);
    }

    if (data.mediaType === MediaType.VIDEO && counts.videos >= PORTFOLIO_MAX_VIDEOS) {
      throw new BadRequestException(`Maximum of ${PORTFOLIO_MAX_VIDEOS} videos allowed`);
    }

    // Enforce subscription tier photo limit
    if (data.mediaType === MediaType.IMAGE) {
      await this.subscriptionsService.enforcePhotoLimit(vendorId, counts.images);
    }

    // Get next sort order
    const maxSortOrder = await this.prisma.vendorPortfolio.aggregate({
      where: { vendorId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

    const item = await this.prisma.vendorPortfolio.create({
      data: {
        vendorId,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType.toUpperCase() as any,
        caption: data.caption,
        sortOrder: nextSortOrder,
      },
    });

    await this.auditService.log({
      action: 'portfolio.upload_confirmed',
      actorId,
      targetType: 'VendorPortfolio',
      targetId: item.id,
      metadata: { vendorId, mediaType: data.mediaType },
    });

    return this.toResponse(item);
  }

  async deleteItem(itemId: string, vendorId: string, actorId: string): Promise<void> {
    const item = await this.prisma.vendorPortfolio.findFirst({
      where: { id: itemId, vendorId },
    });

    if (!item) {
      throw new NotFoundException('Portfolio item not found');
    }

    await this.prisma.vendorPortfolio.delete({
      where: { id: itemId },
    });

    await this.auditService.log({
      action: 'portfolio.item_deleted',
      actorId,
      targetType: 'VendorPortfolio',
      targetId: itemId,
      metadata: { vendorId },
    });
  }

  async findByVendorId(vendorId: string): Promise<PortfolioItem[]> {
    const items = await this.prisma.vendorPortfolio.findMany({
      where: { vendorId },
      orderBy: { sortOrder: 'asc' },
    });

    return items.map((item: any) => this.toResponse(item));
  }

  toResponse(item: any): PortfolioItem {
    return {
      id: item.id,
      vendorId: item.vendorId,
      mediaUrl: item.mediaUrl,
      mediaType: item.mediaType.toLowerCase() as any,
      caption: item.caption ?? undefined,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private async getMediaCounts(vendorId: string): Promise<{ images: number; videos: number }> {
    const [images, videos] = await Promise.all([
      this.prisma.vendorPortfolio.count({
        where: { vendorId, mediaType: 'IMAGE' },
      }),
      this.prisma.vendorPortfolio.count({
        where: { vendorId, mediaType: 'VIDEO' },
      }),
    ]);

    return { images, videos };
  }
}
