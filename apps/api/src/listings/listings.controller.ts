import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingUploadService } from './listing-upload.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ListingOwnerGuard } from '../common/guards/listing-owner.guard';
import {
  createServiceListingSchema,
  createRentalListingSchema,
  updateServiceListingSchema,
  updateRentalListingSchema,
} from '@eventtrust/shared';
import type {
  CreateServiceListingPayload,
  CreateRentalListingPayload,
  UpdateServiceListingPayload,
  UpdateRentalListingPayload,
  AccessTokenPayload,
} from '@eventtrust/shared';

@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly listingUploadService: ListingUploadService,
  ) {}

  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  async getUploadUrl(@CurrentUser() user: AccessTokenPayload) {
    if (!user.vendorId) {
      throw new BadRequestException('You must have a vendor profile to upload photos');
    }
    const uploadParams = await this.listingUploadService.getSignedUploadUrl(user.vendorId);
    return { data: uploadParams };
  }

  @Post('service')
  @HttpCode(HttpStatus.CREATED)
  async createService(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createServiceListingSchema)) body: CreateServiceListingPayload,
  ) {
    if (!user.vendorId) {
      throw new BadRequestException('You must have a vendor profile to create listings');
    }
    const listing = await this.listingsService.createServiceListing(user.vendorId, user.sub, body);
    return { data: listing };
  }

  @Post('rental')
  @HttpCode(HttpStatus.CREATED)
  async createRental(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createRentalListingSchema)) body: CreateRentalListingPayload,
  ) {
    if (!user.vendorId) {
      throw new BadRequestException('You must have a vendor profile to create listings');
    }
    const listing = await this.listingsService.createRentalListing(user.vendorId, user.sub, body);
    return { data: listing };
  }

  @Public()
  @Get()
  async findAll() {
    const listings = await this.listingsService.findAll();
    return { data: listings };
  }

  @Public()
  @Get(':id/similar')
  async findSimilar(@Param('id') id: string, @Query('limit') limit?: string) {
    const listings = await this.listingsService.findSimilar(id, limit ? parseInt(limit, 10) : 4);
    return { data: listings };
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    const listing = await this.listingsService.findById(id);
    if (!listing) throw new NotFoundException('Listing not found');
    return { data: listing };
  }

  @Patch(':id')
  @UseGuards(ListingOwnerGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: UpdateServiceListingPayload | UpdateRentalListingPayload,
  ) {
    // Determine listing type to pick correct validation schema
    const existing = await this.listingsService.findById(id);
    if (!existing) throw new NotFoundException('Listing not found');

    const pipe =
      existing.listingType === 'service'
        ? new ZodValidationPipe(updateServiceListingSchema)
        : new ZodValidationPipe(updateRentalListingSchema);
    const validated = pipe.transform(body);

    const listing = await this.listingsService.update(id, user.sub, validated);
    return { data: listing };
  }

  @Delete(':id')
  @UseGuards(ListingOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    await this.listingsService.softDelete(id, user.sub);
  }
}

@Controller('vendors/:vendorId/listings')
export class VendorListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Public()
  @Get()
  async findByVendorId(@Param('vendorId') vendorId: string) {
    const listings = await this.listingsService.findByVendorId(vendorId);
    return { data: listings };
  }
}
