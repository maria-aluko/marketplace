import { Module } from '@nestjs/common';
import { DisputesService } from './disputes.service';
import {
  DisputesController,
  VendorDisputesController,
  AdminDisputesController,
} from './disputes.controller';
import { DisputeOwnerGuard } from './guards/dispute-owner.guard';
import { AuditModule } from '../audit/audit.module';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [AuditModule, ReviewsModule],
  controllers: [DisputesController, VendorDisputesController, AdminDisputesController],
  providers: [DisputesService, DisputeOwnerGuard],
  exports: [DisputesService],
})
export class DisputesModule {}
