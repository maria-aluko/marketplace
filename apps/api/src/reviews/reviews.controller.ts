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
import { ReviewsService } from './reviews.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReviewOwnerGuard } from '../common/guards/review-owner.guard';
import { createReviewSchema, createVendorReplySchema } from '@eventtrust/shared';
import type {
  CreateReviewPayload,
  CreateVendorReplyPayload,
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
