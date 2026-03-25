import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GuestListsService } from './guest-lists.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('GuestListsService', () => {
  let service: GuestListsService;

  const mockPrisma = {
    guestList: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    guest: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const now = new Date();

  const makeGuest = (overrides?: any) => ({
    id: 'guest-1',
    guestListId: 'list-1',
    name: 'Emeka Chukwu',
    phone: '+2348011111111',
    status: 'PENDING',
    invitationSent: false,
    plusOne: false,
    plusOneName: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  const makeList = (overrides?: any) => ({
    id: 'list-1',
    userId: 'user-1',
    name: 'December Wedding Guests',
    eventDate: null,
    plannedCount: 200,
    deletedAt: null,
    guests: [makeGuest()],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestListsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<GuestListsService>(GuestListsService);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a guest list', async () => {
      mockPrisma.guestList.create.mockResolvedValue(makeList({ guests: [] }));

      const result = await service.create('user-1', {
        name: 'December Wedding Guests',
        plannedCount: 200,
      });

      expect(result.id).toBe('list-1');
      expect(result.name).toBe('December Wedding Guests');
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'guest_list.created' }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return summary with correct attendance totals', async () => {
      mockPrisma.guestList.findMany.mockResolvedValue([
        makeList({
          guests: [
            makeGuest({ status: 'COMING' }),
            makeGuest({ id: 'guest-2', status: 'COMING', plusOne: true }),
            makeGuest({ id: 'guest-3', status: 'NOT_COMING' }),
            makeGuest({ id: 'guest-4', status: 'PENDING' }),
          ],
        }),
      ]);

      const results = await service.findAllByUser('user-1');

      expect(results).toHaveLength(1);
      expect(results[0].totalGuests).toBe(4);
      // COMING count (2) + comingWithPlusOne count (1) = 3 per service logic
      expect(results[0].totalAttending).toBe(3);
      expect(results[0].totalDeclined).toBe(1);
      expect(results[0].totalPending).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return guest list with guests', async () => {
      mockPrisma.guestList.findFirst.mockResolvedValue(makeList());

      const result = await service.findById('list-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result!.guests).toHaveLength(1);
    });

    it('should return null if not found', async () => {
      mockPrisma.guestList.findFirst.mockResolvedValue(null);

      const result = await service.findById('list-999', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete a guest list', async () => {
      mockPrisma.guestList.findFirst.mockResolvedValue(makeList());
      mockPrisma.guestList.update.mockResolvedValue(makeList({ deletedAt: now }));

      await service.softDelete('list-1', 'user-1');

      expect(mockPrisma.guestList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException if list not found', async () => {
      mockPrisma.guestList.findFirst.mockResolvedValue(null);

      await expect(service.softDelete('list-999', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addGuest', () => {
    it('should add a guest to the list', async () => {
      mockPrisma.guestList.findFirst.mockResolvedValue(makeList());
      mockPrisma.guest.create.mockResolvedValue(makeGuest({ name: 'Adaeze Okafor' }));

      const result = await service.addGuest('list-1', 'user-1', {
        name: 'Adaeze Okafor',
        phone: '+2348022222222',
      });

      expect(result.name).toBe('Adaeze Okafor');
      expect(result.status).toBe('PENDING');
    });

    it('should throw NotFoundException if list not found', async () => {
      mockPrisma.guestList.findFirst.mockResolvedValue(null);

      await expect(
        service.addGuest('list-999', 'user-1', { name: 'Nobody' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkAddGuests', () => {
    it('should bulk add guests via transaction', async () => {
      mockPrisma.guestList.findFirst.mockResolvedValue(makeList());
      const createdGuests = [
        makeGuest({ id: 'g1', name: 'Chidi Eze' }),
        makeGuest({ id: 'g2', name: 'Bimpe Adeyemi' }),
      ];
      mockPrisma.$transaction.mockResolvedValue(createdGuests);

      const results = await service.bulkAddGuests('list-1', 'user-1', {
        guests: [{ name: 'Chidi Eze' }, { name: 'Bimpe Adeyemi' }],
      });

      expect(results).toHaveLength(2);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if list not found', async () => {
      mockPrisma.guestList.findFirst.mockResolvedValue(null);

      await expect(
        service.bulkAddGuests('list-999', 'user-1', { guests: [{ name: 'Nobody' }] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateGuest', () => {
    it('should update RSVP status to COMING', async () => {
      mockPrisma.guest.update.mockResolvedValue(makeGuest({ status: 'COMING' }));

      const result = await service.updateGuest('list-1', 'guest-1', { status: 'COMING' });

      expect(result.status).toBe('COMING');
    });
  });

  describe('deleteGuest', () => {
    it('should delete a guest from the list', async () => {
      mockPrisma.guest.delete.mockResolvedValue(makeGuest());

      await service.deleteGuest('list-1', 'guest-1');

      expect(mockPrisma.guest.delete).toHaveBeenCalledWith({
        where: { id: 'guest-1', guestListId: 'list-1' },
      });
    });
  });
});
