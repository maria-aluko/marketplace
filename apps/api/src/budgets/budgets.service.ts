import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  BudgetResponse,
  BudgetSummaryResponse,
  BudgetItemResponse,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  CreateBudgetItemPayload,
  UpdateBudgetItemPayload,
} from '@eventtrust/shared';

@Injectable()
export class BudgetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAllByUser(userId: string): Promise<BudgetSummaryResponse[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { userId, deletedAt: null },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return budgets.map((b) => ({
      id: b.id,
      userId: b.userId,
      name: b.name,
      totalAmount: b.totalAmount ?? undefined,
      eventDate: b.eventDate?.toISOString().split('T')[0] ?? undefined,
      itemCount: b.items.length,
      totalBudgeted: b.items.reduce((s, i) => s + i.budgeted, 0),
      totalActual: b.items.reduce((s, i) => s + i.actual, 0),
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));
  }

  async findById(budgetId: string, userId: string): Promise<BudgetResponse | null> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId, deletedAt: null },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });

    return budget ? this.toResponse(budget) : null;
  }

  async create(userId: string, data: CreateBudgetPayload): Promise<BudgetResponse> {
    const budget = await this.prisma.budget.create({
      data: {
        userId,
        name: data.name,
        totalAmount: data.totalAmount ?? null,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
      },
      include: { items: true },
    });

    await this.auditService.log({
      action: 'budget.created',
      actorId: userId,
      targetType: 'Budget',
      targetId: budget.id,
      metadata: { name: data.name },
    });

    return this.toResponse(budget);
  }

  async update(
    budgetId: string,
    userId: string,
    data: UpdateBudgetPayload,
  ): Promise<BudgetResponse> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.totalAmount !== undefined) {
      updateData.totalAmount = data.totalAmount > 0 ? data.totalAmount : null;
    }
    if (data.eventDate !== undefined) {
      updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    }

    const budget = await this.prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });

    await this.auditService.log({
      action: 'budget.updated',
      actorId: userId,
      targetType: 'Budget',
      targetId: budgetId,
      metadata: { fields: Object.keys(updateData) },
    });

    return this.toResponse(budget);
  }

  async softDelete(budgetId: string, userId: string): Promise<void> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, deletedAt: null },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      action: 'budget.deleted',
      actorId: userId,
      targetType: 'Budget',
      targetId: budgetId,
      metadata: { name: budget.name },
    });
  }

  async addItem(
    budgetId: string,
    userId: string,
    data: CreateBudgetItemPayload,
  ): Promise<BudgetItemResponse> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, userId, deletedAt: null },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    const item = await this.prisma.budgetItem.create({
      data: {
        budgetId,
        name: data.name,
        budgeted: data.budgeted,
        actual: data.actual ?? 0,
        notes: data.notes,
      },
    });

    return this.toItemResponse(item);
  }

  async updateItem(
    budgetId: string,
    itemId: string,
    data: UpdateBudgetItemPayload,
  ): Promise<BudgetItemResponse> {
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.budgeted !== undefined) updateData.budgeted = data.budgeted;
    if (data.actual !== undefined) updateData.actual = data.actual;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const item = await this.prisma.budgetItem.update({
      where: { id: itemId, budgetId },
      data: updateData,
    });

    return this.toItemResponse(item);
  }

  async deleteItem(budgetId: string, itemId: string): Promise<void> {
    await this.prisma.budgetItem.delete({
      where: { id: itemId, budgetId },
    });
  }

  private toResponse(budget: any): BudgetResponse {
    return {
      id: budget.id,
      userId: budget.userId,
      name: budget.name,
      totalAmount: budget.totalAmount ?? undefined,
      eventDate: budget.eventDate?.toISOString().split('T')[0] ?? undefined,
      items: (budget.items ?? []).map((i: any) => this.toItemResponse(i)),
      createdAt: budget.createdAt.toISOString(),
      updatedAt: budget.updatedAt.toISOString(),
    };
  }

  private toItemResponse(item: any): BudgetItemResponse {
    return {
      id: item.id,
      budgetId: item.budgetId,
      name: item.name,
      budgeted: item.budgeted,
      actual: item.actual,
      notes: item.notes ?? undefined,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
