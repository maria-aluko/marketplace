import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GuestListsController } from './guest-lists.controller';
import { GuestListsService } from './guest-lists.service';
import { GuestListOwnerGuard } from './guards/guest-list-owner.guard';

@Module({
  imports: [AuditModule],
  controllers: [GuestListsController],
  providers: [GuestListsService, GuestListOwnerGuard],
})
export class GuestListsModule {}
