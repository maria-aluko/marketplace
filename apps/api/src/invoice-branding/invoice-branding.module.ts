import { Module } from '@nestjs/common';
import { InvoiceBrandingController } from './invoice-branding.controller';
import { InvoiceBrandingService } from './invoice-branding.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [InvoiceBrandingController],
  providers: [InvoiceBrandingService],
  exports: [InvoiceBrandingService],
})
export class InvoiceBrandingModule {}
