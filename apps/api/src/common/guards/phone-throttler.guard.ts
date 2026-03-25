import { Injectable, BadRequestException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class PhoneThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    if (!req.body?.phone) throw new BadRequestException('Phone is required');
    return req.body.phone;
  }
}
