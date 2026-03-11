import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorStatusService } from './services/vendor-status.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { VendorOwnerGuard } from '../common/guards/vendor-owner.guard';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorStatusTransitionSchema,
} from '@eventtrust/shared';
import type {
  CreateVendorPayload,
  UpdateVendorPayload,
  VendorStatusTransitionPayload,
  AccessTokenPayload,
} from '@eventtrust/shared';

@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly vendorStatusService: VendorStatusService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createVendorSchema)) body: CreateVendorPayload,
  ) {
    const vendor = await this.vendorsService.create(user.sub, body);
    return { data: vendor };
  }

  @Patch(':id')
  @UseGuards(VendorOwnerGuard)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVendorSchema)) body: UpdateVendorPayload,
  ) {
    const vendor = await this.vendorsService.update(id, body);
    return { data: vendor };
  }

  @Post(':id/submit')
  @UseGuards(VendorOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async submitForReview(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const vendor = await this.vendorsService.submitForReview(id, user.sub);
    return { data: vendor };
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    const vendor = await this.vendorsService.findById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return { data: vendor };
  }

  @Public()
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const vendor = await this.vendorsService.findBySlug(slug);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return { data: vendor };
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(vendorStatusTransitionSchema))
    body: VendorStatusTransitionPayload,
  ) {
    const vendor = await this.vendorStatusService.transition(
      id,
      body.newStatus,
      user.sub,
      body.reason,
    );
    return { data: vendor };
  }
}
