import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [ReviewsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
