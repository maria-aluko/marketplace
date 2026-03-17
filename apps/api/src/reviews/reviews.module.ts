import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewScoreService } from './services/review-score.service';
import { ClientReviewService } from './services/client-review.service';
import {
  ReviewsController,
  VendorReviewsController,
  ReviewReplyController,
  AdminReviewsController,
  ClientReviewsController,
  AdminClientReviewsController,
} from './reviews.controller';
import { ReviewOwnerGuard } from '../common/guards/review-owner.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [ReviewsController, VendorReviewsController, ReviewReplyController, AdminReviewsController, ClientReviewsController, AdminClientReviewsController],
  providers: [ReviewsService, ReviewScoreService, ClientReviewService, ReviewOwnerGuard, RolesGuard],
  exports: [ReviewsService, ClientReviewService],
})
export class ReviewsModule {}
