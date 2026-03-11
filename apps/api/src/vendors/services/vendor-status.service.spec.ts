import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VendorStatusService } from './vendor-status.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { VendorStatus } from '@eventtrust/shared';

describe('VendorStatusService', () => {
  let service: VendorStatusService;

  const mockPrisma = {
    vendor: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockAudit = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorStatusService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<VendorStatusService>(VendorStatusService);
    vi.clearAllMocks();
  });

  const makeVendor = (status: string) => ({
    id: 'vendor-1',
    status,
    businessName: 'Test',
    slug: 'test',
    category: 'CATERER',
    description: 'Test vendor',
    area: 'Lekki',
    userId: 'user-1',
    avgRating: 0,
    reviewCount: 0,
    profileCompleteScore: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('valid transitions', () => {
    const validTransitions = [
      ['DRAFT', VendorStatus.PENDING],
      ['PENDING', VendorStatus.ACTIVE],
      ['PENDING', VendorStatus.CHANGES_REQUESTED],
      ['CHANGES_REQUESTED', VendorStatus.PENDING],
      ['ACTIVE', VendorStatus.SUSPENDED],
      ['SUSPENDED', VendorStatus.ACTIVE],
    ] as const;

    it.each(validTransitions)(
      'should transition from %s to %s',
      async (fromStatus, toStatus) => {
        const vendor = makeVendor(fromStatus);
        mockPrisma.vendor.findFirst.mockResolvedValue(vendor);
        mockPrisma.vendor.update.mockResolvedValue({ ...vendor, status: toStatus.toUpperCase() });

        const result = await service.transition('vendor-1', toStatus, 'admin-1');

        expect(mockPrisma.vendor.update).toHaveBeenCalled();
        expect(mockAudit.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'vendor.status_change',
            actorId: 'admin-1',
            targetType: 'Vendor',
            targetId: 'vendor-1',
          }),
        );
      },
    );
  });

  describe('invalid transitions', () => {
    const invalidTransitions = [
      ['DRAFT', VendorStatus.ACTIVE],
      ['DRAFT', VendorStatus.SUSPENDED],
      ['ACTIVE', VendorStatus.PENDING],
      ['ACTIVE', VendorStatus.DRAFT],
      ['SUSPENDED', VendorStatus.PENDING],
      ['PENDING', VendorStatus.DRAFT],
    ] as const;

    it.each(invalidTransitions)(
      'should reject transition from %s to %s',
      async (fromStatus, toStatus) => {
        mockPrisma.vendor.findFirst.mockResolvedValue(makeVendor(fromStatus));

        await expect(
          service.transition('vendor-1', toStatus, 'admin-1'),
        ).rejects.toThrow(BadRequestException);
      },
    );
  });

  it('should throw when vendor not found', async () => {
    mockPrisma.vendor.findFirst.mockResolvedValue(null);

    await expect(
      service.transition('vendor-1', VendorStatus.PENDING, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
