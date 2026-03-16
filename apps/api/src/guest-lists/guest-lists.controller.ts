import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { GuestListsService } from './guest-lists.service';
import { GuestListOwnerGuard } from './guards/guest-list-owner.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { AccessTokenPayload } from '@eventtrust/shared';
import {
  createGuestListSchema,
  updateGuestListSchema,
  createGuestSchema,
  updateGuestSchema,
  bulkCreateGuestsSchema,
} from '@eventtrust/shared';
import type {
  CreateGuestListPayload,
  UpdateGuestListPayload,
  CreateGuestPayload,
  UpdateGuestPayload,
  BulkCreateGuestsPayload,
} from '@eventtrust/shared';

@Controller('guest-lists')
export class GuestListsController {
  constructor(private readonly guestListsService: GuestListsService) {}

  @Get()
  async findAll(@CurrentUser() user: AccessTokenPayload) {
    const lists = await this.guestListsService.findAllByUser(user.sub);
    return { data: lists };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createGuestListSchema)) body: CreateGuestListPayload,
  ) {
    const list = await this.guestListsService.create(user.sub, body);
    return { data: list };
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    const list = await this.guestListsService.findById(id, user.sub);
    if (!list) throw new NotFoundException('Guest list not found');
    return { data: list };
  }

  @Patch(':id')
  @UseGuards(GuestListOwnerGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(updateGuestListSchema)) body: UpdateGuestListPayload,
  ) {
    const list = await this.guestListsService.update(id, user.sub, body);
    return { data: list };
  }

  @Delete(':id')
  @UseGuards(GuestListOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload) {
    await this.guestListsService.softDelete(id, user.sub);
  }

  @Post(':id/guests')
  @UseGuards(GuestListOwnerGuard)
  @HttpCode(HttpStatus.CREATED)
  async addGuest(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(createGuestSchema)) body: CreateGuestPayload,
  ) {
    const guest = await this.guestListsService.addGuest(id, user.sub, body);
    return { data: guest };
  }

  @Post(':id/guests/bulk')
  @UseGuards(GuestListOwnerGuard)
  @HttpCode(HttpStatus.CREATED)
  async bulkAddGuests(
    @Param('id') id: string,
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidationPipe(bulkCreateGuestsSchema)) body: BulkCreateGuestsPayload,
  ) {
    const guests = await this.guestListsService.bulkAddGuests(id, user.sub, body);
    return { data: guests };
  }

  @Patch(':id/guests/:guestId')
  @UseGuards(GuestListOwnerGuard)
  async updateGuest(
    @Param('id') id: string,
    @Param('guestId') guestId: string,
    @Body(new ZodValidationPipe(updateGuestSchema)) body: UpdateGuestPayload,
  ) {
    const guest = await this.guestListsService.updateGuest(id, guestId, body);
    return { data: guest };
  }

  @Delete(':id/guests/:guestId')
  @UseGuards(GuestListOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGuest(@Param('id') id: string, @Param('guestId') guestId: string) {
    await this.guestListsService.deleteGuest(id, guestId);
  }
}
