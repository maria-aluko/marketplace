import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

const SOFT_DELETE_MODELS: string[] = ['Vendor', 'Review', 'User', 'Listing'];

function createSoftDeleteExtension() {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async delete({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            return (Prisma as any).getExtensionContext(this)[model as string].update({
              ...args,
              data: { deletedAt: new Date() },
            } as any);
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            return (Prisma as any).getExtensionContext(this)[model as string].updateMany({
              ...args,
              data: { deletedAt: new Date() },
            } as any);
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...(args.where as any), deletedAt: null } as any;
          }
          return query(args);
        },
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            args.where = { ...(args.where as any), deletedAt: null } as any;
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (SOFT_DELETE_MODELS.includes(model)) {
            // findUnique doesn't support deletedAt filter directly,
            // so we let it pass and check after
          }
          return query(args);
        },
      },
    },
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV !== 'production' ? ['warn', 'error'] : ['error'],
    });
  }

  readonly softDelete = this.$extends(createSoftDeleteExtension());

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
