import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TermiiService {
  private readonly logger = new Logger(TermiiService.name);
  private readonly apiKey: string;
  private readonly senderId: string;
  private readonly isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('TERMII_API_KEY', '');
    this.senderId = this.configService.get<string>('TERMII_SENDER_ID', 'EventTrust');
    this.isDev = this.configService.get<string>('NODE_ENV', 'development') !== 'production';
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    if (this.isDev) {
      this.logger.log(`[DEV] OTP for ${phone}: ${code}`);
      return;
    }

    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch('https://v3.api.termii.com/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: phone,
            from: this.senderId,
            sms: `Your EventTrust verification code is: ${code}. It expires in 10 minutes.`,
            type: 'plain',
            channel: 'generic',
            api_key: this.apiKey,
          }),
        });

        if (response.ok) {
          return;
        }

        this.logger.warn(`Termii SMS attempt ${attempt + 1} failed: HTTP ${response.status}`);
      } catch (error) {
        this.logger.warn(`Termii SMS attempt ${attempt + 1} error: ${error}`);
      }

      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }

    this.logger.error(`Failed to send OTP to ${phone} after ${maxRetries} attempts`);
  }
}
