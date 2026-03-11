import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@eventtrust/shared';

@Injectable()
export class VendorOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Admins bypass ownership check
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const vendorId = request.params.id || request.params.vendorId;
    if (user.vendorId !== vendorId) {
      throw new ForbiddenException('You do not own this vendor profile');
    }

    return true;
  }
}
