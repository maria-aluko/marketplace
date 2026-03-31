import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { PrismaService } from '../prisma/prisma.service';

const mockDate = new Date('2026-04-15T00:00:00.000Z');
const mockRecord = {
  id: 'avail-1',
  vendorId: 'vendor-1',
  date: mockDate,
  reason: 'Booked',
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
};

const mockPrisma = {
  vendor: { findFirst: vi.fn() },
  vendorAvailability: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
};

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
  });

  describe('getAvailability', () => {
    it('returns blocked dates for a date range', async () => {
      mockPrisma.vendorAvailability.findMany.mockResolvedValue([mockRecord]);
      const result = await service.getAvailability('vendor-1', '2026-04-01', '2026-04-30');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ vendorId: 'vendor-1', date: '2026-04-15' });
    });

    it('returns all records when no date range provided', async () => {
      mockPrisma.vendorAvailability.findMany.mockResolvedValue([mockRecord]);
      const result = await service.getAvailability('vendor-1');
      expect(mockPrisma.vendorAvailability.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { vendorId: 'vendor-1' } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('blockDate', () => {
    it('creates a new blocked date', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ id: 'vendor-1' });
      mockPrisma.vendorAvailability.upsert.mockResolvedValue(mockRecord);
      const result = await service.blockDate('vendor-1', { date: '2026-04-15', reason: 'Booked' });
      expect(result.date).toBe('2026-04-15');
      expect(mockPrisma.vendorAvailability.upsert).toHaveBeenCalled();
    });

    it('upserts if date already blocked (idempotent)', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue({ id: 'vendor-1' });
      mockPrisma.vendorAvailability.upsert.mockResolvedValue({ ...mockRecord, reason: 'Updated' });
      const result = await service.blockDate('vendor-1', { date: '2026-04-15', reason: 'Updated' });
      expect(result.reason).toBe('Updated');
    });

    it('throws NotFoundException for non-existent vendor', async () => {
      mockPrisma.vendor.findFirst.mockResolvedValue(null);
      await expect(service.blockDate('bad-vendor', { date: '2026-04-15' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('unblockDate', () => {
    it('deletes an existing blocked date', async () => {
      mockPrisma.vendorAvailability.findUnique.mockResolvedValue(mockRecord);
      mockPrisma.vendorAvailability.delete.mockResolvedValue(mockRecord);
      await expect(service.unblockDate('vendor-1', '2026-04-15')).resolves.toBeUndefined();
      expect(mockPrisma.vendorAvailability.delete).toHaveBeenCalled();
    });

    it('throws NotFoundException when date not blocked', async () => {
      mockPrisma.vendorAvailability.findUnique.mockResolvedValue(null);
      await expect(service.unblockDate('vendor-1', '2026-04-15')).rejects.toThrow(NotFoundException);
    });
  });
});
