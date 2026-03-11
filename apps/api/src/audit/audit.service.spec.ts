import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  const mockPrisma = {
    adminLog: {
      create: vi.fn().mockResolvedValue({ id: 'log-1' }),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    vi.clearAllMocks();
  });

  it('should create audit log with correct fields', async () => {
    await service.log({
      action: 'vendor.status_change',
      actorId: 'user-1',
      targetType: 'Vendor',
      targetId: 'vendor-1',
      metadata: { oldStatus: 'draft', newStatus: 'pending' },
    });

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'user-1',
        action: 'vendor.status_change',
        entityType: 'Vendor',
        entityId: 'vendor-1',
        details: { oldStatus: 'draft', newStatus: 'pending' },
      },
    });
  });

  it('should handle missing metadata', async () => {
    await service.log({
      action: 'user.login',
      actorId: 'user-1',
      targetType: 'User',
      targetId: 'user-1',
    });

    expect(mockPrisma.adminLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'user-1',
        action: 'user.login',
        entityType: 'User',
        entityId: 'user-1',
        details: undefined,
      },
    });
  });
});
