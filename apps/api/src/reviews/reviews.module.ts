import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewScoreService } from './services/review-score.service';
import {
  ReviewsController,
  VendorReviewsController,
  ReviewReplyController,
} from './reviews.controller';
import { ReviewOwnerGuard } from '../common/guards/review-owner.guard';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [ReviewsController, VendorReviewsController, ReviewReplyController],
  providers: [ReviewsService, ReviewScoreService, ReviewOwnerGuard],
  exports: [ReviewsService],
})
export class ReviewsModule {}
