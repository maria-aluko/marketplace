import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { VendorsModule } from './vendors/vendors.module';
import { ListingsModule } from './listings/listings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';
import { SearchModule } from './search/search.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GuestListsModule } from './guest-lists/guest-lists.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { InvoicesModule } from './invoices/invoices.module';
import { InvoiceBrandingModule } from './invoice-branding/invoice-branding.module';
import { ClientsModule } from './clients/clients.module';
import { DisputesModule } from './disputes/disputes.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        const schema = z.object({
          DATABASE_URL: z.string().url(),
          DIRECT_DATABASE_URL: z.string().url(),
          JWT_SECRET: z.string().min(32),
          JWT_REFRESH_SECRET: z.string().min(32),
          TERMII_API_KEY: z.string().min(1),
          TERMII_SENDER_ID: z.string().min(1),
          CLOUDINARY_CLOUD_NAME: z.string().min(1),
          CLOUDINARY_API_KEY: z.string().min(1),
          CLOUDINARY_API_SECRET: z.string().min(1),
          RESEND_API_KEY: z.string().min(1),
          FRONTEND_URL: z.string().url(),
          SENTRY_DSN: z.string().optional(),
          NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
          PORT: z.coerce.number().default(4000),
        });
        return schema.parse(config);
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuditModule,
    AuthModule,
    VendorsModule,
    ListingsModule,
    NotificationsModule,
    PortfolioModule,
    ReviewsModule,
    AdminModule,
    SearchModule,
    BudgetsModule,
    GuestListsModule,
    InquiriesModule,
    InvoicesModule,
    InvoiceBrandingModule,
    ClientsModule,
    DisputesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CsrfMiddleware)
      .exclude(
        'auth/otp/request',
        'auth/otp/verify',
        'auth/refresh',
        'auth/csrf-token',
        'health',
        { path: 'invoices/:id/confirm', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
