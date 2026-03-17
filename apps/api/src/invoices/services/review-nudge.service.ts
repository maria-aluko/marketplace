import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class ReviewNudgeService {
  private readonly logger = new Logger(ReviewNudgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron('0 17 * * *', { timeZone: 'Africa/Lagos' })
  async sendReviewNudges(): Promise<void> {
    this.logger.log('Running review nudge cron job');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    const invoices = await this.prisma.invoice.findMany({
      where: {
        eventDate: {
          gte: new Date(`${yesterdayDate}T00:00:00.000Z`),
          lt: new Date(`${yesterdayDate}T23:59:59.999Z`),
        },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
        reviewNudgeSentAt: null,
        clientPhone: { not: null },
      },
      include: {
        vendor: { select: { businessName: true } },
      },
    });

    this.logger.log(`Found ${invoices.length} invoices eligible for review nudge`);

    for (const invoice of invoices) {
      try {
        const reviewUrl = `${process.env.WEB_URL || 'https://eventtrust.com.ng'}/reviews/new/${invoice.vendorId}?invoiceId=${invoice.id}`;
        const message = `Hi! How was your event with ${invoice.vendor.businessName}? Share your experience: ${reviewUrl}`;

        await this.notificationsService.sendSms(invoice.clientPhone!, message);

        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { reviewNudgeSentAt: new Date() },
        });

        this.logger.log(`Review nudge sent for invoice ${invoice.id}`);
      } catch (err) {
        this.logger.error(`Failed to send review nudge for invoice ${invoice.id}: ${err}`);
      }
    }
  }
}
