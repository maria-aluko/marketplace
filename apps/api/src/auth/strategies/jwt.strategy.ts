import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import type { AccessTokenPayload } from '@eventtrust/shared';
import { ACCESS_COOKIE_NAME } from '@eventtrust/shared';

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.[ACCESS_COOKIE_NAME] || null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: AccessTokenPayload) {
    return {
      sub: payload.sub,
      role: payload.role,
      vendorId: payload.vendorId,
    };
  }
}
