import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly isDev: boolean;
  private readonly termiiApiKey: string;
  private readonly termiiSenderId: string;
  private readonly resendApiKey: string;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.isDev = this.configService.get<string>('NODE_ENV', 'development') !== 'production';
    this.termiiApiKey = this.configService.get<string>('TERMII_API_KEY', '');
    this.termiiSenderId = this.configService.get<string>('TERMII_SENDER_ID', 'EventTrust');
    this.resendApiKey = this.configService.get<string>('RESEND_API_KEY', '');
    this.fromEmail = this.configService.get<string>('FROM_EMAIL', 'noreply@eventtrust.com.ng');
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.log(`[DEV] Email to ${to}: ${subject}`);
        return;
      }

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          html,
        }),
      });
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error}`);
    }
  }

  async sendSms(phone: string, message: string): Promise<void> {
    try {
      if (this.isDev) {
        this.logger.log(`[DEV] SMS to ${phone}: ${message}`);
        return;
      }

      await fetch('https://v3.api.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          from: this.termiiSenderId,
          sms: message,
          type: 'plain',
          channel: 'generic',
          api_key: this.termiiApiKey,
        }),
      });
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error}`);
    }
  }

  async notifyVendorNewReview(vendorPhone: string, reviewerName: string): Promise<void> {
    const message = `EventTrust: You have a new review from ${reviewerName}. Log in to view it.`;
    await this.sendSms(vendorPhone, message);
  }

  async notifyClientReviewApproved(clientPhone: string, vendorName: string): Promise<void> {
    const message = `EventTrust: Your review for ${vendorName} has been approved and is now visible.`;
    await this.sendSms(clientPhone, message);
  }
}
