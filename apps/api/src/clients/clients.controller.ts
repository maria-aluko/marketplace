import { Controller, Post, Get, Patch, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createClientProfileSchema,
  updateClientProfileSchema,
} from '@eventtrust/shared';
import type { CreateClientProfilePayload, UpdateClientProfilePayload, AccessTokenPayload } from '@eventtrust/shared';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post('profile')
  @HttpCode(HttpStatus.CREATED)
  async createProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createClientProfileSchema)) body: CreateClientProfilePayload,
  ) {
    const profile = await this.clientsService.createProfile(user.sub, body);
    return { data: profile };
  }

  @Get('profile/me')
  async getProfile(@CurrentUser() user: AccessTokenPayload) {
    const profile = await this.clientsService.getProfile(user.sub);
    return { data: profile };
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(updateClientProfileSchema)) body: UpdateClientProfilePayload,
  ) {
    const profile = await this.clientsService.updateProfile(user.sub, body);
    return { data: profile };
  }
}
