import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AccessTokenPayload } from '@eventtrust/shared';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('analytics')
  async getAnalytics() {
    const analytics = await this.adminService.getAnalytics();
    return { data: analytics };
  }

  @Get('vendors/pending')
  async getPendingVendors(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.adminService.getPendingVendors(
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
    return result;
  }

  @Get('reviews/pending')
  async getPendingReviews(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.adminService.getPendingReviews(
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
    return result;
  }

  @Patch('reviews/:id/approve')
  async approveReview(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
  ) {
    const review = await this.adminService.approveReview(id, user.sub);
    return { data: review };
  }

  @Patch('reviews/:id/reject')
  async rejectReview(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body('reason') reason: string,
  ) {
    const review = await this.adminService.rejectReview(id, user.sub, reason);
    return { data: review };
  }

  @Delete('reviews/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeReview(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body('reason') reason: string,
  ) {
    await this.adminService.removeReview(id, user.sub, reason);
  }
}
