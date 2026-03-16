import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  InvoiceBrandingResponse,
  UpdateInvoiceBrandingPayload,
  SignedUploadResponse,
} from '@eventtrust/shared';

@Injectable()
export class InvoiceBrandingService {
  private readonly logger = new Logger(InvoiceBrandingService.name);
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  private readonly ALLOWED_TIERS = ['PRO', 'PRO_PLUS'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME', '');
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY', '');
    this.apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET', '');
  }

  private async assertBrandingTier(vendorId: string): Promise<void> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
      select: { subscriptionTier: true },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    if (!this.ALLOWED_TIERS.includes(vendor.subscriptionTier)) {
      throw new ForbiddenException('Invoice branding requires a Pro subscription');
    }
  }

  async getBranding(vendorId: string): Promise<InvoiceBrandingResponse | null> {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, deletedAt: null },
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const branding = await this.prisma.invoiceBranding.findUnique({
      where: { vendorId },
    });

    if (!branding) return null;

    return this.toResponse(branding);
  }

  async upsertBranding(
    vendorId: string,
    actorId: string,
    data: UpdateInvoiceBrandingPayload,
  ): Promise<InvoiceBrandingResponse> {
    await this.assertBrandingTier(vendorId);

    const branding = await this.prisma.invoiceBranding.upsert({
      where: { vendorId },
      create: {
        vendorId,
        accentColor: data.accentColor ?? '#16a34a',
        tagline: data.tagline ?? null,
        footerText: data.footerText ?? null,
      },
      update: {
        ...(data.accentColor !== undefined && { accentColor: data.accentColor }),
        ...(data.tagline !== undefined && { tagline: data.tagline }),
        ...(data.footerText !== undefined && { footerText: data.footerText }),
      },
    });

    await this.auditService.log({
      action: 'invoice_branding.updated',
      actorId,
      targetType: 'InvoiceBranding',
      targetId: branding.id,
      metadata: { vendorId },
    });

    return this.toResponse(branding);
  }

  async getLogoUploadUrl(vendorId: string): Promise<SignedUploadResponse> {
    await this.assertBrandingTier(vendorId);

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'eventtrust/logos';

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

  async confirmLogoUpload(
    vendorId: string,
    actorId: string,
    logoUrl: string,
  ): Promise<InvoiceBrandingResponse> {
    await this.assertBrandingTier(vendorId);

    const branding = await this.prisma.invoiceBranding.upsert({
      where: { vendorId },
      create: {
        vendorId,
        logoUrl,
        accentColor: '#16a34a',
      },
      update: { logoUrl },
    });

    await this.auditService.log({
      action: 'invoice_branding.logo_uploaded',
      actorId,
      targetType: 'InvoiceBranding',
      targetId: branding.id,
      metadata: { vendorId, logoUrl },
    });

    return this.toResponse(branding);
  }

  async deleteLogo(vendorId: string, actorId: string): Promise<void> {
    await this.assertBrandingTier(vendorId);

    const branding = await this.prisma.invoiceBranding.findUnique({
      where: { vendorId },
    });

    if (!branding) {
      throw new NotFoundException('Branding not found');
    }

    await this.prisma.invoiceBranding.update({
      where: { vendorId },
      data: { logoUrl: null },
    });

    await this.auditService.log({
      action: 'invoice_branding.logo_deleted',
      actorId,
      targetType: 'InvoiceBranding',
      targetId: branding.id,
      metadata: { vendorId },
    });
  }

  toResponse(branding: any): InvoiceBrandingResponse {
    return {
      logoUrl: branding.logoUrl ?? undefined,
      accentColor: branding.accentColor,
      tagline: branding.tagline ?? undefined,
      footerText: branding.footerText ?? undefined,
    };
  }
}
