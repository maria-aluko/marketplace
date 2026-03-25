import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('BudgetsService', () => {
  let service: BudgetsService;

  const mockPrisma = {
    budget: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    budgetItem: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const now = new Date();

  const makeItem = (overrides?: any) => ({
    id: 'item-1',
    budgetId: 'budget-1',
    name: 'Catering',
    budgeted: 500000,
    actual: 0,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  const makeBudget = (overrides?: any) => ({
    id: 'budget-1',
    userId: 'user-1',
    name: 'December Wedding Budget',
    totalAmount: 5000000,
    eventDate: null,
    deletedAt: null,
    items: [makeItem()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<BudgetsService>(BudgetsService);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a budget and log audit', async () => {
      mockPrisma.budget.create.mockResolvedValue(makeBudget({ items: [] }));

      const result = await service.create('user-1', {
        name: 'December Wedding Budget',
        totalAmount: 5000000,
      });

      expect(result.id).toBe('budget-1');
      expect(result.name).toBe('December Wedding Budget');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'budget.created' }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return budgets with totals calculated from items', async () => {
      mockPrisma.budget.findMany.mockResolvedValue([
        makeBudget({
          items: [
            makeItem({ budgeted: 300000, actual: 250000 }),
            makeItem({ id: 'item-2', name: 'Venue', budgeted: 200000, actual: 200000 }),
          ],
        }),
      ]);

      const results = await service.findAllByUser('user-1');

      expect(results).toHaveLength(1);
      expect(results[0].totalBudgeted).toBe(500000);
      expect(results[0].totalActual).toBe(450000);
      expect(results[0].itemCount).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return budget with items for owner', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(makeBudget());

      const result = await service.findById('budget-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
    });

    it('should return null if not found', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null);

      const result = await service.findById('budget-999', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a budget', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(makeBudget());
      mockPrisma.budget.update.mockResolvedValue(makeBudget({ deletedAt: now }));

      await service.softDelete('budget-1', 'user-1');

      expect(mockPrisma.budget.update).toHaveBeenCalledWith({
        where: { id: 'budget-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'budget.deleted' }),
      );
    });

    it('should throw NotFoundException if budget not found', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null);

      await expect(service.softDelete('budget-999', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addItem', () => {
    it('should add an item to the budget', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(makeBudget());
      mockPrisma.budgetItem.create.mockResolvedValue(makeItem({ name: 'DJ Services' }));

      const result = await service.addItem('budget-1', 'user-1', {
        name: 'DJ Services',
        budgeted: 150000,
      });

      expect(result.name).toBe('DJ Services');
      expect(result.actual).toBe(0);
    });

    it('should throw NotFoundException if budget not found or not owned by user', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null);

      await expect(
        service.addItem('budget-1', 'user-other', { name: 'DJ Services', budgeted: 150000 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateItem', () => {
    it('should update item fields', async () => {
      mockPrisma.budgetItem.update.mockResolvedValue(
        makeItem({ actual: 140000 }),
      );

      const result = await service.updateItem('budget-1', 'item-1', { actual: 140000 });

      expect(result.actual).toBe(140000);
    });
  });

  describe('deleteItem', () => {
    it('should delete an item from the budget', async () => {
      mockPrisma.budgetItem.delete.mockResolvedValue(makeItem());

      await service.deleteItem('budget-1', 'item-1');

      expect(mockPrisma.budgetItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1', budgetId: 'budget-1' },
      });
    });
  });
});
