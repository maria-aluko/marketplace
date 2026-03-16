import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GuestStatus as DbGuestStatus } from '@prisma/client';
import { GuestStatus } from '@eventtrust/shared';
import type {
  GuestListResponse,
  GuestListSummaryResponse,
  GuestResponse,
  CreateGuestListPayload,
  UpdateGuestListPayload,
  CreateGuestPayload,
  UpdateGuestPayload,
  BulkCreateGuestsPayload,
} from '@eventtrust/shared';

@Injectable()
export class GuestListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAllByUser(userId: string): Promise<GuestListSummaryResponse[]> {
    const lists = await this.prisma.guestList.findMany({
      where: { userId, deletedAt: null },
      include: { guests: true },
      orderBy: { createdAt: 'desc' },
    });

    return lists.map((l) => this.toSummaryResponse(l));
  }

  async findById(id: string, userId: string): Promise<GuestListResponse | null> {
    const list = await this.prisma.guestList.findFirst({
      where: { id, userId, deletedAt: null },
      include: { guests: { orderBy: { createdAt: 'asc' } } },
    });

    return list ? this.toResponse(list) : null;
  }

  async create(userId: string, data: CreateGuestListPayload): Promise<GuestListResponse> {
    const list = await this.prisma.guestList.create({
      data: {
        userId,
        name: data.name,
        eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
        plannedCount: data.plannedCount ?? null,
      },
      include: { guests: true },
    });

    await this.auditService.log({
      action: 'guest_list.created',
      actorId: userId,
      targetType: 'GuestList',
      targetId: list.id,
      metadata: { name: data.name },
    });

    return this.toResponse(list);
  }

  async update(
    id: string,
    userId: string,
    data: UpdateGuestListPayload,
  ): Promise<GuestListResponse> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.eventDate !== undefined) {
      updateData.eventDate = data.eventDate ? new Date(data.eventDate) : null;
    }
    if (data.plannedCount !== undefined) {
      updateData.plannedCount = data.plannedCount ?? null;
    }

    const list = await this.prisma.guestList.update({
      where: { id },
      data: updateData,
      include: { guests: { orderBy: { createdAt: 'asc' } } },
    });

    await this.auditService.log({
      action: 'guest_list.updated',
      actorId: userId,
      targetType: 'GuestList',
      targetId: id,
      metadata: { fields: Object.keys(updateData) },
    });

    return this.toResponse(list);
  }

  async softDelete(id: string, userId: string): Promise<void> {
    const list = await this.prisma.guestList.findFirst({
      where: { id, deletedAt: null },
    });

    if (!list) {
      throw new NotFoundException('Guest list not found');
    }

    await this.prisma.guestList.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.log({
      action: 'guest_list.deleted',
      actorId: userId,
      targetType: 'GuestList',
      targetId: id,
      metadata: { name: list.name },
    });
  }

  async addGuest(
    listId: string,
    userId: string,
    data: CreateGuestPayload,
  ): Promise<GuestResponse> {
    const list = await this.prisma.guestList.findFirst({
      where: { id: listId, userId, deletedAt: null },
    });

    if (!list) {
      throw new NotFoundException('Guest list not found');
    }

    const guest = await this.prisma.guest.create({
      data: {
        guestListId: listId,
        name: data.name,
        phone: data.phone ?? null,
        status: (data.status as unknown as DbGuestStatus) ?? DbGuestStatus.PENDING,
        plusOne: data.plusOne ?? false,
        plusOneName: data.plusOneName ?? null,
        notes: data.notes ?? null,
      },
    });

    return this.toGuestResponse(guest);
  }

  async bulkAddGuests(
    listId: string,
    userId: string,
    data: BulkCreateGuestsPayload,
  ): Promise<GuestResponse[]> {
    const list = await this.prisma.guestList.findFirst({
      where: { id: listId, userId, deletedAt: null },
    });

    if (!list) {
      throw new NotFoundException('Guest list not found');
    }

    const created = await this.prisma.$transaction(
      data.guests.map((g) =>
        this.prisma.guest.create({
          data: {
            guestListId: listId,
            name: g.name,
            phone: g.phone ?? null,
            status: DbGuestStatus.PENDING,
          },
        }),
      ),
    );

    return created.map((g) => this.toGuestResponse(g));
  }

  async updateGuest(
    listId: string,
    guestId: string,
    data: UpdateGuestPayload,
  ): Promise<GuestResponse> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone ?? null;
    if (data.status !== undefined) updateData.status = data.status as unknown as DbGuestStatus;
    if (data.invitationSent !== undefined) updateData.invitationSent = data.invitationSent;
    if (data.plusOne !== undefined) updateData.plusOne = data.plusOne;
    if (data.plusOneName !== undefined) updateData.plusOneName = data.plusOneName ?? null;
    if (data.notes !== undefined) updateData.notes = data.notes ?? null;

    const guest = await this.prisma.guest.update({
      where: { id: guestId, guestListId: listId },
      data: updateData,
    });

    return this.toGuestResponse(guest);
  }

  async deleteGuest(listId: string, guestId: string): Promise<void> {
    await this.prisma.guest.delete({
      where: { id: guestId, guestListId: listId },
    });
  }

  private toSummaryResponse(list: any): GuestListSummaryResponse {
    const guests = list.guests ?? [];
    const comingWithPlusOne = guests.filter(
      (g: any) => g.status === 'COMING' && g.plusOne,
    ).length;
    const coming = guests.filter((g: any) => g.status === 'COMING').length;

    return {
      id: list.id,
      userId: list.userId,
      name: list.name,
      eventDate: list.eventDate?.toISOString().split('T')[0] ?? undefined,
      plannedCount: list.plannedCount ?? undefined,
      totalGuests: guests.length,
      totalAttending: coming + comingWithPlusOne,
      totalDeclined: guests.filter((g: any) => g.status === 'NOT_COMING').length,
      totalPending: guests.filter(
        (g: any) => g.status === 'PENDING' || g.status === 'INVITED',
      ).length,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    };
  }

  private toResponse(list: any): GuestListResponse {
    return {
      id: list.id,
      userId: list.userId,
      name: list.name,
      eventDate: list.eventDate?.toISOString().split('T')[0] ?? undefined,
      plannedCount: list.plannedCount ?? undefined,
      guests: (list.guests ?? []).map((g: any) => this.toGuestResponse(g)),
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
    };
  }

  private toGuestResponse(guest: any): GuestResponse {
    return {
      id: guest.id,
      guestListId: guest.guestListId,
      name: guest.name,
      phone: guest.phone ?? undefined,
      status: guest.status as GuestStatus,
      invitationSent: guest.invitationSent,
      plusOne: guest.plusOne,
      plusOneName: guest.plusOneName ?? undefined,
      notes: guest.notes ?? undefined,
      createdAt: guest.createdAt.toISOString(),
      updatedAt: guest.updatedAt.toISOString(),
    };
  }
}
