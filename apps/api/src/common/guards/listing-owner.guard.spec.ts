import { ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ListingOwnerGuard } from './listing-owner.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@eventtrust/shared';

describe('ListingOwnerGuard', () => {
  let guard: ListingOwnerGuard;

  const mockPrisma = {
    listing: {
      findFirst: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingOwnerGuard,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    guard = module.get<ListingOwnerGuard>(ListingOwnerGuard);
    vi.clearAllMocks();
  });

  function createContext(user: any, params: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as any;
  }

  it('should allow listing owner', async () => {
    mockPrisma.listing.findFirst.mockResolvedValue({ vendorId: 'vendor-1' });
    const ctx = createContext(
      { sub: 'user-1', role: UserRole.VENDOR, vendorId: 'vendor-1' },
      { id: 'listing-1' },
    );

    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should reject non-owner', async () => {
    mockPrisma.listing.findFirst.mockResolvedValue({ vendorId: 'vendor-1' });
    const ctx = createContext(
      { sub: 'user-2', role: UserRole.VENDOR, vendorId: 'vendor-2' },
      { id: 'listing-1' },
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should allow admin regardless of ownership', async () => {
    mockPrisma.listing.findFirst.mockResolvedValue({ vendorId: 'vendor-1' });
    const ctx = createContext(
      { sub: 'admin-1', role: UserRole.ADMIN },
      { id: 'listing-1' },
    );

    expect(await guard.canActivate(ctx)).toBe(true);
  });

  it('should throw NotFoundException when listing not found', async () => {
    mockPrisma.listing.findFirst.mockResolvedValue(null);
    const ctx = createContext(
      { sub: 'user-1', role: UserRole.VENDOR, vendorId: 'vendor-1' },
      { id: 'listing-999' },
    );

    await expect(guard.canActivate(ctx)).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException when no user present', async () => {
    const ctx = createContext(null, { id: 'listing-1' });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
