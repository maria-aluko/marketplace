import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VendorOwnerGuard } from '../common/guards/vendor-owner.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { createInquirySchema, updateInquiryStatusSchema } from '@eventtrust/shared';
import type { CreateInquiryPayload, UpdateInquiryStatusPayload, AccessTokenPayload } from '@eventtrust/shared';

@Controller()
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post('inquiries')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createInquirySchema)) body: CreateInquiryPayload,
  ) {
    const inquiry = await this.inquiriesService.create(user.sub, body);
    return { data: inquiry };
  }

  @Get('inquiries')
  async findByClient(@CurrentUser() user: AccessTokenPayload) {
    const inquiries = await this.inquiriesService.findByClient(user.sub);
    return { data: inquiries };
  }

  @Get('vendors/:vendorId/inquiries')
  @UseGuards(VendorOwnerGuard)
  async findByVendor(@Param('vendorId') vendorId: string) {
    const inquiries = await this.inquiriesService.findByVendor(vendorId);
    return { data: inquiries };
  }

  @Patch('inquiries/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(updateInquiryStatusSchema)) body: UpdateInquiryStatusPayload,
  ) {
    const inquiry = await this.inquiriesService.updateStatus(id, user.sub, body);
    return { data: inquiry };
  }
}
