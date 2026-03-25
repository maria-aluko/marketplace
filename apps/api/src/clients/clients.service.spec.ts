import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClientsService', () => {
  let service: ClientsService;

  const mockPrisma = {
    clientProfile: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const now = new Date();

  const makeProfile = (overrides?: any) => ({
    id: 'profile-1',
    userId: 'user-1',
    displayName: 'Ngozi Eze',
    email: 'ngozi@example.com',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    vi.clearAllMocks();
  });

  describe('createProfile', () => {
    it('should create a client profile', async () => {
      mockPrisma.clientProfile.findUnique.mockResolvedValue(null);
      mockPrisma.clientProfile.create.mockResolvedValue(makeProfile());

      const result = await service.createProfile('user-1', {
        displayName: 'Ngozi Eze',
        email: 'ngozi@example.com',
      });

      expect(result.id).toBe('profile-1');
      expect(result.displayName).toBe('Ngozi Eze');
      expect(mockPrisma.clientProfile.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', displayName: 'Ngozi Eze' }),
        }),
      );
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockPrisma.clientProfile.findUnique.mockResolvedValue(makeProfile());

      await expect(
        service.createProfile('user-1', { displayName: 'Ngozi Eze', email: 'ngozi@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getProfile', () => {
    it('should return profile by userId', async () => {
      mockPrisma.clientProfile.findUnique.mockResolvedValue(makeProfile());

      const result = await service.getProfile('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.email).toBe('ngozi@example.com');
    });

    it('should throw NotFoundException if profile not found', async () => {
      mockPrisma.clientProfile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should update display name', async () => {
      mockPrisma.clientProfile.findUnique.mockResolvedValue(makeProfile());
      mockPrisma.clientProfile.update.mockResolvedValue(
        makeProfile({ displayName: 'Ngozi Okonkwo' }),
      );

      const result = await service.updateProfile('user-1', { displayName: 'Ngozi Okonkwo' });

      expect(result.displayName).toBe('Ngozi Okonkwo');
    });

    it('should throw NotFoundException if profile does not exist', async () => {
      mockPrisma.clientProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile('user-999', { displayName: 'Ghost User' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
