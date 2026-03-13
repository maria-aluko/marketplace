import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingUploadService } from './listing-upload.service';
import { ListingsController, VendorListingsController } from './listings.controller';
import { ListingOwnerGuard } from '../common/guards/listing-owner.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ListingsController, VendorListingsController],
  providers: [ListingsService, ListingUploadService, ListingOwnerGuard],
  exports: [ListingsService],
})
export class ListingsModule {}
