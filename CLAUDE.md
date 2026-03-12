# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EventTrust Nigeria — a verified event vendor marketplace for services and equipment rentals in Lagos. Mobile-first PWA for clients to find trustworthy caterers, photographers, venues, and equipment rental vendors (tents, chairs, generators, lighting). Vendors sign up with phone OTP, get verified by admins, and build trust through reviewed portfolios, client reviews, and multiple service/rental listings.

## Architecture

**Turborepo monorepo** with pnpm workspaces. Two apps + two shared packages:

```
eventtrust/
├── apps/api/         # NestJS backend (api.eventtrust.com.ng) → Railway
├── apps/web/         # Next.js 15 frontend (eventtrust.com.ng) → Vercel
├── packages/shared/  # @eventtrust/shared — types, enums, constants, Zod schemas
└── packages/config/  # @eventtrust/config — shared ESLint, TS, Prettier configs
```

**Strict rule: Next.js never accesses the database directly.** All data flows through the NestJS API.

## Tech Stack

- **Backend:** NestJS 11, Prisma ORM (Supabase Postgres), Termii (OTP/SMS), Cloudinary (media), Resend (email)
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, shadcn/ui
- **Shared:** Zod schemas (validation in both apps), TypeScript enums/types/constants
- **Auth:** Phone OTP (Termii) → JWT (httpOnly cookies, never localStorage). Argon2 for OTP hashing. Refresh token rotation.
- **Security:** Helmet, @nestjs/throttler, CSRF double-submit cookie pattern
- **Observability:** Pino (structured logging), Sentry (error tracking), health endpoint
- **Testing:** Vitest, Supertest, React Testing Library, Playwright
- **CI/CD:** GitHub Actions (lint → typecheck → test → build), Vercel + Railway auto-deploy

## Build Commands

```bash
pnpm turbo run dev          # Dev servers (API :4000, Web :3000)
pnpm turbo run build        # Production build all packages
pnpm turbo run test         # Unit + integration tests
pnpm turbo run test:e2e     # E2E tests
pnpm turbo run typecheck    # Type checking
pnpm turbo run lint         # Linting
pnpm db:migrate             # Prisma migrations
pnpm db:push                # Push schema to DB
pnpm db:seed                # Seed dev data
pnpm check-env              # Validate env vars
```

## NestJS Module Map

```
apps/api/src/
├── main.ts           # Helmet, CORS, cookie-parser, Pino logger
├── app.module.ts     # Imports all modules, APP_GUARD (JwtAuthGuard), APP_FILTER, CSRF middleware
├── prisma/           # PrismaService (global, soft-delete extension via $extends)
├── health/           # GET /health with DB + service pings
├── audit/            # AuditService.log() — append-only admin_log
├── auth/             # OTP, JWT, guards, CSRF middleware
│   ├── auth.controller.ts     # /auth/otp/request, /auth/otp/verify, /auth/refresh, /auth/logout, /auth/me, /auth/csrf-token
│   ├── auth.service.ts        # requestOtp, verifyOtp, refreshTokens, logout, generateTokens
│   ├── strategies/jwt.strategy.ts  # Cookie-based JWT extraction
│   └── services/termii.service.ts  # SMS OTP delivery (logs in dev)
├── vendors/          # CRUD, status machine, slug generation
│   ├── vendors.controller.ts  # POST /vendors, PATCH /vendors/:id, POST /vendors/:id/submit, GET /vendors/:id, PATCH /vendors/:id/status
│   ├── vendors.service.ts     # create, update, submitForReview, findById, findBySlug
│   └── services/vendor-status.service.ts  # transition() with audit logging
├── listings/         # (Phase 2) Service + rental listing CRUD
│   ├── listings.controller.ts   # POST /listings, PATCH /listings/:id, DELETE /listings/:id, GET /listings/:id
│   ├── listings.service.ts      # create, update, delete, findById
│   └── dto/                     # CreateServiceListingDto, CreateRentalListingDto
├── portfolio/        # (Phase 2) Cloudinary signed URL, upload confirmation
├── reviews/          # (Phase 2) Submission, scoring, replies
├── disputes/         # (Phase 3) Dispute workflow, evidence, decisions
├── search/           # (Phase 2) Ranked search with SQL scoring across listings
├── admin/            # (Phase 3) Moderation queues, analytics
├── notifications/    # (Phase 2) Resend email + Termii SMS (internal only)
└── common/
    ├── decorators/   # @Public(), @CurrentUser(), @Roles()
    ├── guards/       # JwtAuthGuard (global), RolesGuard, VendorOwnerGuard, PhoneThrottlerGuard
    ├── middleware/    # CsrfMiddleware (double-submit cookie)
    ├── filters/      # GlobalExceptionFilter (Prisma error mapping)
    └── pipes/        # ZodValidationPipe (wraps Zod schemas for NestJS)
```

Modules are self-contained (own controller, service, DTOs). No direct cross-module service imports — use events or shared interfaces.

## Shared Package (`@eventtrust/shared`)

| In Shared | NOT in Shared |
|-----------|---------------|
| Enums (VendorStatus, UserRole, etc.) | Prisma client/generated types (backend only) |
| `ListingType` enum: `service \| rental` | NestJS decorators, guards, pipes |
| `RentalCategory` enum: `tent \| chairs_tables \| cooking_equipment \| generator \| lighting \| other_rental` | React components, hooks |
| `DeliveryOption` enum: `pickup_only \| delivery_only \| both` | Environment config shapes |
| `SubscriptionTier` enum: `free \| pro \| pro_plus` | Service implementations |
| API request/response type interfaces | — |
| `CreateServiceListingPayload`, `CreateRentalListingPayload`, `ListingResponse` types | — |
| `createServiceListingSchema`, `createRentalListingSchema` Zod schemas | — |
| Business rule constants (limits, weights) | — |
| Zod validation schemas | — |
| Lagos areas list | — |

## Key Business Rules

- **Vendor status machine:** `draft → pending → active | changes_requested | suspended`. All transitions go through a single `VendorStatusService.transition()` method with mandatory audit logging.
- **Listing ownership:** A vendor can create multiple listings (services and rentals). Each listing belongs to exactly one vendor.
- **Rental quantity:** `quantityAvailable` tracks total stock. Future inventory management will track `quantityBooked` vs `quantityAvailable`.
- **Listing visibility:** Only listings under `status = 'active'` vendors appear in search results.
- **Subscription tiers:** `free | pro | pro_plus` stored on Vendor. Tier limits (listing count, photo count) enforced in `ListingsService`. Schema-ready from Phase 2; business logic in Phase 3.
- **Reviews:** One per vendor per client per calendar year. Min 50 chars (DB constraint). Vendor gets one reply per review, editable within 48hrs. Soft deletes only.
- **Disputes:** Vendor can raise within 72hrs of review approval. Status: `open → decided → appealed → closed`. One appeal allowed.
- **Search ranking (ORDER BY in SQL):** `avg_rating * 0.5 + (LEAST(review_count, 50)/50 * 0.3) + (profile_complete_score * 0.1) + (recency_score * 0.1)`. Only `status = 'active'` vendors shown.
- **Phone numbers:** Always E.164 format (`+234XXXXXXXXXX`), validated via Zod schema in `@eventtrust/shared`.
- **OTP rate limit:** Max 3 requests per phone per 10 minutes. Max 5 verify attempts per OTP.

## Database

Prisma ORM connecting to Supabase Postgres. Schema at `apps/api/prisma/schema.prisma`.

Key tables: `users`, `auth_identities`, `vendors`, `listings`, `listing_rental_details`, `vendor_portfolio`, `otp_requests`, `refresh_tokens`, `reviews`, `vendor_replies`, `disputes`, `admin_log`.

- `listings` — polymorphic listing (type: SERVICE | RENTAL), owned by a Vendor
- `listing_rental_details` — rental-specific fields (quantity, pricePerDay, depositAmount, deliveryOption, condition) — 1:1 with Listing

- Soft-delete middleware (Prisma client extension) on: User, Vendor, Review
- `admin_log` is append-only — never update or delete rows
- `auth_identities` supports phone, Google, Facebook providers from day one
- Pooled connection via PgBouncer (`DATABASE_URL`), direct for migrations (`DIRECT_DATABASE_URL`)

## Coding Conventions

### NestJS Backend
- Prisma client in global `PrismaModule`, injected via DI everywhere
- Every state-changing endpoint calls `AuditService` before returning
- Validation via `ZodValidationPipe` wrapping Zod schemas from `@eventtrust/shared`
- Admin endpoints require both `JwtAuthGuard` AND `RolesGuard('admin')`
- `VendorOwnerGuard` checks `req.user.vendorId === params.id` on vendor mutations
- Soft deletes only on vendors, reviews, users (handled by Prisma extension)

### Next.js Frontend
- Server components by default; client components only for interactive elements
- **Two API utilities — never use raw `fetch()` in pages or components:**
  - **Client components:** `apiClient` (`src/lib/api-client.ts`) — handles CSRF tokens, auto-refresh on 401, `credentials: 'include'`
  - **Server components:** `serverFetch<T>(path, options?)` (`src/lib/server-api.ts`) — lightweight fetch with Next.js caching (`revalidate`, `tags`), returns `T | null`
- JWT in httpOnly cookies only, CSRF token in requests
- Mobile-first CSS (375px base, scale up)
- All forms must show loading and error states
- Dynamic `og:image`, `og:title`, `og:description` on vendor profile pages (WhatsApp sharing is a primary discovery channel)

### Portfolio Upload Flow
NestJS never handles binary files. Flow: frontend requests signed Cloudinary URL from NestJS → frontend uploads directly to Cloudinary → frontend confirms upload back to NestJS → NestJS stores media_url in DB. Max 10 images or 2 videos per vendor.

## Code Examples

### Controller endpoint with auth + Zod validation

```ts
// apps/api/src/vendors/vendors.controller.ts
@Post()
@HttpCode(HttpStatus.CREATED)
async create(
  @CurrentUser() user: AccessTokenPayload,
  @Body(new ZodValidationPipe(createVendorSchema)) body: CreateVendorPayload,
) {
  const vendor = await this.vendorsService.create(user.sub, body);
  return { data: vendor };
}

// Public route (skips JWT guard)
@Public()
@Get(':id')
async findById(@Param('id') id: string) { ... }

// Admin-only route
@Patch(':id/status')
@UseGuards(RolesGuard)
@Roles('ADMIN')
async updateStatus(@Param('id') id: string, @CurrentUser() user: AccessTokenPayload, ...) { ... }

// Owner-only route
@Patch(':id')
@UseGuards(VendorOwnerGuard)
async update(@Param('id') id: string, ...) { ... }
```

### Audit logging pattern

```ts
// Every state change logs to admin_log (append-only)
await this.auditService.log({
  action: 'vendor.status_change',
  actorId: userId,
  targetType: 'Vendor',
  targetId: vendorId,
  metadata: { oldStatus, newStatus, reason },
});
```

### Vendor status transitions

```ts
// apps/api/src/vendors/services/vendor-status.service.ts
async transition(vendorId: string, newStatus: VendorStatus, actorId: string, reason?: string) {
  const vendor = await this.prisma.vendor.findFirst({ where: { id: vendorId, deletedAt: null } });
  const allowedTransitions = VALID_STATUS_TRANSITIONS[vendor.status.toLowerCase()];
  if (!allowedTransitions.includes(newStatus)) throw new BadRequestException(...);
  // update + audit log
}
```

### Auth cookie pattern

```ts
// apps/api/src/auth/auth.controller.ts — OTP verify sets cookies
res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
  httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/', maxAge: 15 * 60 * 1000,
});
res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
  httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000,
});
res.cookie(CSRF_COOKIE_NAME, csrfToken, {
  httpOnly: false, sameSite: 'lax', secure: isProduction, path: '/',  // readable by JS for double-submit
});
```

### Frontend API client with CSRF + auto-refresh (client components)

```ts
// apps/web/src/lib/api-client.ts — use in 'use client' components only
// Mutating requests auto-attach CSRF token from cookie
if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
  const csrfToken = getCsrfTokenFromCookie();
  if (csrfToken) headers[CSRF_HEADER_NAME] = csrfToken;
}
// 401 responses auto-retry after refreshing tokens
if (res.status === 401 && !options?.skipRefreshRetry) {
  const refreshed = await this.attemptRefresh();
  if (refreshed) return this.request<T>(method, path, { ...options, skipRefreshRetry: true });
}
```

### Server-side API fetch (server components)

```ts
// apps/web/src/lib/server-api.ts — use in server components and generateMetadata()
import { serverFetch } from '@/lib/server-api';

// Basic usage (default 60s revalidate)
const listing = await serverFetch<ListingResponse>(`/listings/${id}`);

// With custom caching
const vendor = await serverFetch<VendorResponse>(`/vendors/${slug}`, {
  revalidate: 300,
  tags: ['vendor', slug],
});
```

### Frontend auth hook usage

```tsx
// components use useAuth() hook — never call fetch() directly
const { requestOtp, verifyOtp, error, submitting } = useAuth();
const result = await requestOtp('+2348012345678');
const user = await verifyOtp(phone, code);
```

### Zod schema in shared package (used by both apps)

```ts
// packages/shared/src/validation/index.ts
export const otpVerifySchema = z.object({
  phone: phoneSchema,                                          // +234XXXXXXXXXX
  code: z.string().length(OTP_LENGTH, `OTP must be ${OTP_LENGTH} digits`),
});
export const createVendorSchema = vendorBaseSchema.refine(priceRangeRefinement, { ... });
```

### Unit test pattern (Vitest + NestJS Testing)

```ts
// apps/api/src/vendors/services/vendor-status.service.spec.ts
const module = await Test.createTestingModule({
  providers: [
    VendorStatusService,
    { provide: PrismaService, useValue: mockPrisma },
    { provide: AuditService, useValue: mockAudit },
  ],
}).compile();
// Test valid/invalid transitions with it.each()
it.each(validTransitions)('should transition from %s to %s', async (from, to) => { ... });
```

### Frontend component test pattern (Vitest + RTL)

```tsx
// apps/web/src/components/auth/otp-request-form.test.tsx
vi.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ requestOtp: mockRequestOtp, ... }) }));
render(<OtpRequestForm onSuccess={onSuccess} />);
fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+2348012345678' } });
fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
await waitFor(() => { expect(mockRequestOtp).toHaveBeenCalledWith('+2348012345678'); });
```
