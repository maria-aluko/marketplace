import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { VendorOwnerGuard } from './vendor-owner.guard';
import { UserRole } from '@eventtrust/shared';

describe('VendorOwnerGuard', () => {
  let guard: VendorOwnerGuard;

  beforeEach(() => {
    guard = new VendorOwnerGuard();
  });

  function createContext(user: any, params: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as any;
  }

  it('should allow vendor owner', () => {
    const ctx = createContext(
      { sub: 'user-1', role: UserRole.VENDOR, vendorId: 'vendor-1' },
      { id: 'vendor-1' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject non-owner', () => {
    const ctx = createContext(
      { sub: 'user-2', role: UserRole.VENDOR, vendorId: 'vendor-2' },
      { id: 'vendor-1' },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow admin regardless of ownership', () => {
    const ctx = createContext(
      { sub: 'admin-1', role: UserRole.ADMIN },
      { id: 'vendor-1' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw when no user present', () => {
    const ctx = createContext(null, { id: 'vendor-1' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
