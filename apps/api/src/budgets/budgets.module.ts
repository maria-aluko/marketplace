import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetOwnerGuard } from './guards/budget-owner.guard';

@Module({
  imports: [AuditModule],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetOwnerGuard],
})
export class BudgetsModule {}
