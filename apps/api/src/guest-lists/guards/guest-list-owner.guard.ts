import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@eventtrust/shared';

@Injectable()
export class GuestListOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // Admins bypass ownership check
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const guestListId = request.params.id;
    const guestList = await this.prisma.guestList.findFirst({
      where: { id: guestListId, deletedAt: null },
      select: { userId: true },
    });

    if (!guestList) {
      throw new NotFoundException('Guest list not found');
    }

    if (guestList.userId !== user.sub) {
      throw new ForbiddenException('You do not own this guest list');
    }

    return true;
  }
}
