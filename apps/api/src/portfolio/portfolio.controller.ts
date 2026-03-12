import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VendorOwnerGuard } from '../common/guards/vendor-owner.guard';
import { confirmUploadSchema } from '@eventtrust/shared';
import type { ConfirmUploadPayload, AccessTokenPayload } from '@eventtrust/shared';

@Controller('vendors/:vendorId/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Public()
  @Get()
  async findByVendorId(@Param('vendorId') vendorId: string) {
    const items = await this.portfolioService.findByVendorId(vendorId);
    return { data: items };
  }

  @Post('upload-url')
  @UseGuards(VendorOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async getUploadUrl(
    @Param('vendorId') vendorId: string,
  ) {
    const uploadParams = await this.portfolioService.getSignedUploadUrl(vendorId);
    return { data: uploadParams };
  }

  @Post('confirm')
  @UseGuards(VendorOwnerGuard)
  @HttpCode(HttpStatus.CREATED)
  async confirmUpload(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(confirmUploadSchema)) body: ConfirmUploadPayload,
  ) {
    const item = await this.portfolioService.confirmUpload(vendorId, user.sub, body);
    return { data: item };
  }

  @Delete(':itemId')
  @UseGuards(VendorOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(
    @Param('vendorId') vendorId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    await this.portfolioService.deleteItem(itemId, vendorId, user.sub);
  }
}
