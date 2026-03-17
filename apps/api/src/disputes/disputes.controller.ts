import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DisputesService } from './disputes.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { VendorOwnerGuard } from '../common/guards/vendor-owner.guard';
import { DisputeOwnerGuard } from './guards/dispute-owner.guard';
import {
  createDisputeSchema,
  disputeDecisionSchema,
  disputeAppealSchema,
} from '@eventtrust/shared';
import type {
  CreateDisputePayload,
  DisputeDecisionPayload,
  DisputeAppealPayload,
  AccessTokenPayload,
} from '@eventtrust/shared';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createDisputeSchema)) body: CreateDisputePayload,
  ) {
    const dispute = await this.disputesService.create(user.vendorId!, user.sub, body);
    return { data: dispute };
  }

  @Post(':id/appeal')
  @UseGuards(DisputeOwnerGuard)
  @HttpCode(HttpStatus.OK)
  async appeal(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(disputeAppealSchema)) body: DisputeAppealPayload,
  ) {
    const dispute = await this.disputesService.appeal(id, user.vendorId!, user.sub, body);
    return { data: dispute };
  }
}

@Controller('vendors/:vendorId/disputes')
export class VendorDisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  @UseGuards(VendorOwnerGuard)
  async findByVendor(@Param('vendorId') vendorId: string) {
    const disputes = await this.disputesService.findByVendor(vendorId);
    return { data: disputes };
  }
}

@Controller('admin/disputes')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminDisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  async findPending(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    const result = await this.disputesService.findPending(cursor, limit ? parseInt(limit, 10) : 20);
    return { data: result };
  }

  @Post(':id/decide')
  @HttpCode(HttpStatus.OK)
  async decide(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(disputeDecisionSchema)) body: DisputeDecisionPayload,
  ) {
    const dispute = await this.disputesService.decide(id, user.sub, body);
    return { data: dispute };
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  async close(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const dispute = await this.disputesService.close(id, user.sub);
    return { data: dispute };
  }
}
