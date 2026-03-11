import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { VendorsController } from './vendors.controller';
import { VendorStatusService } from './services/vendor-status.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [VendorsController],
  providers: [VendorsService, VendorStatusService],
  exports: [VendorsService],
})
export class VendorsModule {}
