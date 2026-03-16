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
export class BudgetOwnerGuard implements CanActivate {
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

    const budgetId = request.params.id;
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, deletedAt: null },
      select: { userId: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    if (budget.userId !== user.sub) {
      throw new ForbiddenException('You do not own this budget');
    }

    return true;
  }
}
