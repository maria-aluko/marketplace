import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SignedUploadResponse } from '@eventtrust/shared';

@Injectable()
export class ListingUploadService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME', '');
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY', '');
    this.apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET', '');
  }

  async getSignedUploadUrl(vendorId: string): Promise<SignedUploadResponse> {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = `eventtrust/vendors/${vendorId}/listings`;

    const crypto = await import('crypto');
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder,
    };
  }
}
