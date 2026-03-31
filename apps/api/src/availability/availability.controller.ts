import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Public } from '../common/decorators/public.decorator';
import { VendorOwnerGuard } from '../common/guards/vendor-owner.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { blockDateSchema } from '@eventtrust/shared';
import type { BlockDatePayload } from '@eventtrust/shared';

@Controller('vendors/:vendorId/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @Get()
  async getAvailability(
    @Param('vendorId') vendorId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const availability = await this.availabilityService.getAvailability(vendorId, from, to);
    return { data: availability };
  }

  @Post()
  @UseGuards(VendorOwnerGuard)
  @HttpCode(HttpStatus.CREATED)
  async blockDate(
    @Param('vendorId') vendorId: string,
    @Body(new ZodValidationPipe(blockDateSchema)) body: BlockDatePayload,
  ) {
    const record = await this.availabilityService.blockDate(vendorId, body);
    return { data: record };
  }

  @Delete(':date')
  @UseGuards(VendorOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unblockDate(
    @Param('vendorId') vendorId: string,
    @Param('date') date: string,
  ) {
    await this.availabilityService.unblockDate(vendorId, date);
  }
}
