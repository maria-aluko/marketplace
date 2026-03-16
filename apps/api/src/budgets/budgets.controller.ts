import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { BudgetOwnerGuard } from './guards/budget-owner.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AccessTokenPayload } from '@eventtrust/shared';
import {
  createBudgetSchema,
  updateBudgetSchema,
  createBudgetItemSchema,
  updateBudgetItemSchema,
} from '@eventtrust/shared';
import type {
  CreateBudgetPayload,
  UpdateBudgetPayload,
  CreateBudgetItemPayload,
  UpdateBudgetItemPayload,
} from '@eventtrust/shared';

@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async findAll(@CurrentUser() user: AccessTokenPayload) {
    const budgets = await this.budgetsService.findAllByUser(user.sub);
    return { data: budgets };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createBudgetSchema)) body: CreateBudgetPayload,
  ) {
    const budget = await this.budgetsService.create(user.sub, body);
    return { data: budget };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const budget = await this.budgetsService.findById(id, user.sub);
    if (!budget) throw new NotFoundException('Budget not found');
    return { data: budget };
  }

  @Patch(':id')
  @UseGuards(BudgetOwnerGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(updateBudgetSchema)) body: UpdateBudgetPayload,
  ) {
    const budget = await this.budgetsService.update(id, user.sub, body);
    return { data: budget };
  }

  @Delete(':id')
  @UseGuards(BudgetOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    await this.budgetsService.softDelete(id, user.sub);
  }

  @Post(':id/items')
  @UseGuards(BudgetOwnerGuard)
  @HttpCode(HttpStatus.CREATED)
  async addItem(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createBudgetItemSchema)) body: CreateBudgetItemPayload,
  ) {
    const item = await this.budgetsService.addItem(id, user.sub, body);
    return { data: item };
  }

  @Patch(':id/items/:itemId')
  @UseGuards(BudgetOwnerGuard)
  async updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateBudgetItemSchema)) body: UpdateBudgetItemPayload,
  ) {
    const item = await this.budgetsService.updateItem(id, itemId, body);
    return { data: item };
  }

  @Delete(':id/items/:itemId')
  @UseGuards(BudgetOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    await this.budgetsService.deleteItem(id, itemId);
  }
}
