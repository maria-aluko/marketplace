import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ClientReviewService } from './services/client-review.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ReviewOwnerGuard } from '../common/guards/review-owner.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { createReviewSchema, createVendorReplySchema, createClientReviewSchema } from '@eventtrust/shared';
import type {
  CreateReviewPayload,
  CreateVendorReplyPayload,
  CreateClientReviewPayload,
  AccessTokenPayload,
} from '@eventtrust/shared';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createReviewSchema)) body: CreateReviewPayload,
  ) {
    const review = await this.reviewsService.create(user.sub, body);
    return { data: review };
  }

  @Public()
  @Get(':id')
  async findById(@Param('id') id: string) {
    const review = await this.reviewsService.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    return { data: review };
  }
}

@Controller('listings/:listingId/reviews')
export class ListingReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  async findByListingId(@Param('listingId') listingId: string) {
    const reviews = await this.reviewsService.findByListingId(listingId);
    return { data: reviews };
  }
}

@Controller('vendors/:vendorId/reviews')
export class VendorReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  async findByVendorId(@Param('vendorId') vendorId: string) {
    const reviews = await this.reviewsService.findByVendorId(vendorId);
    return { data: reviews };
  }
}

@Controller('admin/reviews')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('pending')
  async findPending(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    const result = await this.reviewsService.findPending(cursor, limit ? parseInt(limit, 10) : 20);
    return { data: result };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const review = await this.reviewsService.approve(id, user.sub);
    return { data: review };
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: { reason: string },
  ) {
    const review = await this.reviewsService.reject(id, user.sub, body.reason);
    return { data: review };
  }

  @Post(':id/remove')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body() body: { reason: string },
  ) {
    await this.reviewsService.remove(id, user.sub, body.reason);
    return { message: 'Review removed' };
  }
}

@Controller('reviews/:reviewId/reply')
export class ReviewReplyController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(ReviewOwnerGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReply(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createVendorReplySchema)) body: CreateVendorReplyPayload,
  ) {
    const reply = await this.reviewsService.createReply(
      reviewId,
      user.vendorId!,
      user.sub,
      body,
    );
    return { data: reply };
  }

  @Patch()
  @UseGuards(ReviewOwnerGuard)
  async updateReply(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createVendorReplySchema)) body: CreateVendorReplyPayload,
  ) {
    const reply = await this.reviewsService.updateReply(
      reviewId,
      user.vendorId!,
      user.sub,
      body,
    );
    return { data: reply };
  }
}

@Controller('client-reviews')
export class ClientReviewsController {
  constructor(private readonly clientReviewService: ClientReviewService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createClientReviewSchema)) body: CreateClientReviewPayload,
  ) {
    const review = await this.clientReviewService.create(user.vendorId!, user.sub, body);
    return { data: review };
  }
}

@Controller('admin/client-reviews')
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class AdminClientReviewsController {
  constructor(private readonly clientReviewService: ClientReviewService) {}

  @Get('pending')
  async findPending() {
    const reviews = await this.clientReviewService.findPending();
    return { data: reviews };
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const review = await this.clientReviewService.approve(id, user.sub);
    return { data: review };
  }
}
