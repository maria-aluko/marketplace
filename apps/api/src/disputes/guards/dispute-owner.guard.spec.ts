import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DisputeOwnerGuard } from './dispute-owner.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@eventtrust/shared';

describe('DisputeOwnerGuard', () => {
  let guard: DisputeOwnerGuard;

  const mockPrisma = {
    dispute: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisputeOwnerGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<DisputeOwnerGuard>(DisputeOwnerGuard);
    vi.clearAllMocks();
  });

  const makeContext = (user: any, params: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as unknown as ExecutionContext);

  it('should allow vendor who owns the dispute', async () => {
    mockPrisma.dispute.findUnique.mockResolvedValue({ vendorId: 'vendor-1' });

    const ctx = makeContext({ role: UserRole.VENDOR, vendorId: 'vendor-1' }, { id: 'dispute-1' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
  });

  it('should deny vendor who does not own the dispute', async () => {
    mockPrisma.dispute.findUnique.mockResolvedValue({ vendorId: 'vendor-other' });

    const ctx = makeContext({ role: UserRole.VENDOR, vendorId: 'vendor-1' }, { id: 'dispute-1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should allow admin regardless of ownership', async () => {
    const ctx = makeContext({ role: UserRole.ADMIN, vendorId: undefined }, { id: 'dispute-1' });
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(mockPrisma.dispute.findUnique).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if dispute does not exist', async () => {
    mockPrisma.dispute.findUnique.mockResolvedValue(null);

    const ctx = makeContext({ role: UserRole.VENDOR, vendorId: 'vendor-1' }, { id: 'dispute-999' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
  });
});
