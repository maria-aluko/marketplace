import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateClientProfilePayload, UpdateClientProfilePayload, ClientProfileResponse } from '@eventtrust/shared';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, data: CreateClientProfilePayload): Promise<ClientProfileResponse> {
    const existing = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException('Client profile already exists');
    }

    const profile = await this.prisma.clientProfile.create({
      data: {
        userId,
        displayName: data.displayName,
        email: data.email,
      },
    });

    return this.toResponse(profile);
  }

  async getProfile(userId: string): Promise<ClientProfileResponse> {
    const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }
    return this.toResponse(profile);
  }

  async updateProfile(userId: string, data: UpdateClientProfilePayload): Promise<ClientProfileResponse> {
    const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Client profile not found');
    }

    const updated = await this.prisma.clientProfile.update({
      where: { userId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.email !== undefined && { email: data.email }),
      },
    });

    return this.toResponse(updated);
  }

  private toResponse(profile: {
    id: string;
    userId: string;
    displayName: string;
    email: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ClientProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      email: profile.email ?? undefined,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}
