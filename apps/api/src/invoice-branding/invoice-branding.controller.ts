import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InvoiceBrandingService } from './invoice-branding.service';
import { VendorOwnerGuard } from '../common/guards/vendor-owner.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  updateInvoiceBrandingSchema,
  confirmLogoUploadSchema,
} from '@eventtrust/shared';
import type {
  UpdateInvoiceBrandingPayload,
  AccessTokenPayload,
} from '@eventtrust/shared';
import { z } from 'zod';

@Controller('vendors/:vendorId/invoice-branding')
@UseGuards(VendorOwnerGuard)
export class InvoiceBrandingController {
  constructor(private readonly brandingService: InvoiceBrandingService) {}

  @Get()
  async getBranding(@Param('vendorId') vendorId: string) {
    const branding = await this.brandingService.getBranding(vendorId);
    return { data: branding };
  }

  @Put()
  async upsertBranding(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(updateInvoiceBrandingSchema)) body: UpdateInvoiceBrandingPayload,
  ) {
    const branding = await this.brandingService.upsertBranding(vendorId, user.sub, body);
    return { data: branding };
  }

  @Post('logo-url')
  @HttpCode(HttpStatus.OK)
  async getLogoUploadUrl(@Param('vendorId') vendorId: string) {
    const result = await this.brandingService.getLogoUploadUrl(vendorId);
    return { data: result };
  }

  @Post('logo')
  @HttpCode(HttpStatus.OK)
  async confirmLogoUpload(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(confirmLogoUploadSchema)) body: z.infer<typeof confirmLogoUploadSchema>,
  ) {
    const branding = await this.brandingService.confirmLogoUpload(vendorId, user.sub, body.logoUrl);
    return { data: branding };
  }

  @Delete('logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLogo(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    await this.brandingService.deleteLogo(vendorId, user.sub);
  }
}
