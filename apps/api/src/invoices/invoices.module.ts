import { Module } from '@nestjs/common';
import {
  InvoicesController,
  VendorInvoicesController,
  ClientInvoicesController,
} from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceOwnerGuard } from './guards/invoice-owner.guard';
import { ReviewNudgeService } from './services/review-nudge.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { InquiriesModule } from '../inquiries/inquiries.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvoiceBrandingModule } from '../invoice-branding/invoice-branding.module';

@Module({
  imports: [PrismaModule, AuditModule, InquiriesModule, NotificationsModule, InvoiceBrandingModule],
  controllers: [InvoicesController, VendorInvoicesController, ClientInvoicesController],
  providers: [InvoicesService, InvoiceOwnerGuard, ReviewNudgeService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
