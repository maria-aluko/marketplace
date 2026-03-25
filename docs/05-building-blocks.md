# 5 — Building Block View

> **Purpose**: Shows the static decomposition of EventTrust Nigeria — what modules exist, what they own, and how they relate.
> Level 1 = top-level apps & packages. Level 2 = internal module structure.

---

## 5.1 Level 1 — Turborepo Packages

```
eventtrust/
├── apps/api/         NestJS 11 backend — all business logic, DB access → Railway
├── apps/web/         Next.js 15 frontend — UI, SSR, PWA → Vercel
├── packages/shared/  @eventtrust/shared — enums, types, Zod schemas, constants
└── packages/config/  @eventtrust/config — shared TS, ESLint, Prettier configs
```

### Dependency Rules (MUST be followed)

```
apps/web      → packages/shared    ✅ allowed
apps/api      → packages/shared    ✅ allowed
apps/web      → apps/api           ❌ NEVER (web talks to API via HTTP only)
apps/api      → apps/web           ❌ NEVER
packages/shared → apps/*           ❌ NEVER (shared must not import app code)
packages/config → apps/*           ❌ NEVER
```

---

## 5.2 Level 2 — `apps/api/src/` (NestJS 11)

```
apps/api/src/
├── main.ts             Helmet, CORS, cookie-parser, Pino logger, global validation pipe
├── app.module.ts       Root module — imports all feature modules, APP_GUARD (JwtAuthGuard),
│                       APP_FILTER (GlobalExceptionFilter), CSRF middleware
├── prisma/             PrismaService (global, soft-delete extension via $extends)
├── health/             GET /health — DB + service pings
├── audit/              AuditService.log() — append-only admin_log
│
├── auth/               OTP request/verify, JWT, CSRF, refresh token rotation
│   ├── auth.controller.ts    /auth/otp/request, /auth/otp/verify, /auth/refresh,
│   │                         /auth/logout, /auth/me, /auth/csrf-token
│   ├── auth.service.ts       requestOtp, verifyOtp, refreshTokens, logout, generateTokens
│   ├── strategies/jwt.strategy.ts   Cookie-based JWT extraction
│   └── services/termii.service.ts   SMS OTP delivery (logs in dev, calls Termii in prod)
│
├── vendors/            Vendor profile CRUD, status machine, slug generation
│   ├── vendors.controller.ts  POST /vendors, PATCH /vendors/:id, GET /vendors/:id,
│   │                          POST /vendors/:id/submit, PATCH /vendors/:id/status
│   ├── vendors.service.ts     create, update, submitForReview, findById, findBySlug
│   └── services/vendor-status.service.ts   transition() with audit logging
│
├── listings/           (Phase 2) Service + rental listing CRUD
│   ├── listings.controller.ts  POST /listings, PATCH /listings/:id,
│   │                           DELETE /listings/:id, GET /listings/:id (public)
│   ├── listings.service.ts     create, update, delete, findById
│   └── dto/                    CreateServiceListingDto, CreateRentalListingDto
│
├── portfolio/          (Phase 2) Cloudinary signed URL + upload confirmation
├── reviews/            (Phase 2) Review submission, scoring, vendor replies, moderation
│   │                   GET /vendors/:vendorId/reviews/pending — vendor pending review queue
├── search/             (Phase 2) Ranked SQL search across listings table
├── notifications/      (Phase 2) Resend email + Termii SMS (internal only)
├── disputes/           (Phase 3) Dispute workflow, evidence, decisions
├── admin/              (Phase 3) Moderation queues, analytics
│   │                   GET /admin/audit-log — paginated audit log for admin UI
│
├── budgets/            (Phase 2+) Client budget planner — CRUD, items, totals
├── guest-lists/        (Phase 2+) Guest list management — RSVP tracking, bulk import
├── inquiries/          (Phase 2+) Vendor inquiry CRM — status machine, invoice linking
├── invoices/           (Phase 2+) Invoice lifecycle — create, send, confirm (token-gated), complete
├── invoice-branding/   (Phase 2+) Vendor invoice branding — logo, color, tagline (Pro tier)
├── clients/            (Phase 2+) Client profile CRUD
│
└── common/
    ├── decorators/     @Public(), @CurrentUser(), @Roles()
    ├── guards/         JwtAuthGuard (global APP_GUARD), RolesGuard, VendorOwnerGuard,
    │                   PhoneThrottlerGuard (throws 400 on missing phone — no IP fallback)
    ├── middleware/     CsrfMiddleware (double-submit cookie)
    ├── filters/        GlobalExceptionFilter (Prisma error mapping: P2002→409, P2025→404;
    │                   Sentry.captureException() for 5xx paths)
    └── pipes/          ZodValidationPipe (wraps Zod schemas from @eventtrust/shared)
```

**Module rules:**
- Modules are self-contained (own controller, service, DTOs)
- No direct cross-module service imports — use events or shared interfaces
- Every state-changing endpoint calls `AuditService.log()` before returning
- Admin endpoints require `JwtAuthGuard` AND `RolesGuard('ADMIN')`
- `VendorOwnerGuard` checks `req.user.vendorId === params.id` on vendor/listing mutations
- All `findUnique` calls on soft-delete models (`User`, `Vendor`, `Review`, `Listing`) must use `findFirst({ where: { ..., deletedAt: null } })` instead
- Free-text inputs (`businessName`, `description`, `listing title`, `review reply`) are stripped with `sanitize-html` before DB writes
- Public endpoints excluded from CSRF (like `POST /invoices/:id/confirm`) must use their own authorization mechanism (e.g., `confirmToken`)

---

## 5.3 Level 2 — `packages/shared/` (`@eventtrust/shared`)

```
packages/shared/src/
├── enums/
│   ├── vendor-status.enum.ts   DRAFT | PENDING | ACTIVE | CHANGES_REQUESTED | SUSPENDED
│   ├── user-role.enum.ts       CLIENT | VENDOR | ADMIN
│   ├── vendor-category.enum.ts catering | photography | dj | decorator | planner | venue
│   ├── listing-type.enum.ts    SERVICE | RENTAL
│   ├── rental-category.enum.ts tent | chairs_tables | cooking_equipment |
│   │                           generator | lighting | other_rental
│   ├── delivery-option.enum.ts pickup_only | delivery_only | both
│   ├── subscription-tier.enum.ts free | pro | pro_plus
│   ├── review-status.enum.ts   PENDING | APPROVED | REMOVED
│   ├── dispute-status.enum.ts  OPEN | DECIDED | APPEALED | CLOSED
│   ├── auth-provider.enum.ts   PHONE | GOOGLE | FACEBOOK
│   └── media-type.enum.ts      IMAGE | VIDEO
│
├── validation/
│   ├── auth.schema.ts          otpRequestSchema, otpVerifySchema
│   ├── vendor.schema.ts        createVendorSchema, updateVendorSchema, vendorStatusTransitionSchema
│   ├── listing.schema.ts       createServiceListingSchema, createRentalListingSchema,
│   │                           updateListingSchema
│   ├── review.schema.ts        createReviewSchema, vendorReplySchema
│   ├── dispute.schema.ts       createDisputeSchema
│   ├── search.schema.ts        searchQuerySchema
│   └── upload.schema.ts        confirmUploadSchema
│
├── types/
│   ├── auth.types.ts           AccessTokenPayload, RefreshTokenPayload, AuthResponse
│   ├── vendor.types.ts         VendorResponse, VendorStatusTransitionPayload
│   ├── listing.types.ts        CreateServiceListingPayload, CreateRentalListingPayload,
│   │                           ListingResponse, RentalDetailsResponse
│   ├── review.types.ts         ReviewResponse, VendorReplyPayload
│   └── search.types.ts         SearchQuery, SearchResult
│
├── constants/
│   ├── auth.constants.ts       ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, CSRF_COOKIE_NAME,
│   │                           CSRF_HEADER_NAME, OTP_LENGTH, OTP_TTL_SECONDS, JWT_EXPIRY
│   ├── vendor.constants.ts     VALID_STATUS_TRANSITIONS, SLUG_MAX_LENGTH,
│   │                           PORTFOLIO_MAX_IMAGES, PORTFOLIO_MAX_VIDEOS
│   ├── listing.constants.ts    LISTING_MAX_PHOTOS, FREE_TIER_LISTING_LIMIT
│   ├── ranking.constants.ts    RANKING_WEIGHTS (avg_rating: 0.5, review_count: 0.3, ...)
│   └── areas.constants.ts      LAGOS_AREAS (22 areas)
│
└── utils/
    ├── phone.ts                normaliseNigerianPhone(), formatPhone()
    ├── currency.ts             formatNGN(), koboToNaira(), nairaToKobo()
    └── date.ts                 formatWAT(), toWATDate()
```

**What belongs in `@eventtrust/shared`:**
- Zod schemas (and their inferred types)
- Enums and constants shared between FE and BE
- Pure utility functions (no I/O, no DB, no HTTP)
- Nothing else

---

## 5.4 Level 2 — `apps/web/src/` (Next.js 15)

```
apps/web/src/
├── app/
│   ├── layout.tsx              Root layout: fonts, providers, viewport meta
│   ├── page.tsx                Home — search entry, featured vendors/listings
│   ├── login/page.tsx          OTP request + verify flow
│   ├── search/page.tsx         Listing search with filters (listingType, category, area)
│   ├── vendor/
│   │   ├── [slug]/page.tsx     Public vendor profile (SSR, og:image, og:title)
│   │   └── signup/page.tsx     Multi-step vendor onboarding (4 steps)
│   └── dashboard/
│       ├── page.tsx            Authenticated vendor dashboard (profile, status)
│       └── listings/page.tsx   Listing management UI (add service / add rental) [Phase 2]
│
├── components/
│   ├── ui/                     shadcn/ui components (DO NOT EDIT — extend via variants)
│   ├── layout/                 Header, Footer, BottomNav, PageShell
│   ├── auth/                   OtpRequestForm, OtpVerifyForm
│   ├── vendor/                 VendorCard, VendorProfile, VendorSignupForm
│   ├── listings/               ListingCard, ServiceListingForm, RentalListingForm [Phase 2]
│   ├── search/                 SearchBar, SearchFilters, SearchResults
│   └── shared/                 LoadingSpinner, ErrorBoundary, OfflineBanner
│
├── lib/
│   ├── api-client.ts           Typed fetch wrapper — CSRF attach, 401 auto-refresh
│   └── whatsapp.ts             buildWhatsAppLink(phone, message) → wa.me URL
│
├── hooks/
│   ├── use-auth.ts             useAuth() — requestOtp, verifyOtp, logout, currentUser
│   ├── use-listings.ts         useListings(), useListingById() [Phase 2]
│   └── use-network-status.ts   useIsOnline() → OfflineBanner
│
├── middleware.ts               Edge: JWT validation, redirect /dashboard → /login
└── public/
    └── manifest.json           PWA manifest (Phase 3)
```

### Frontend Rules
- Server components by default; `'use client'` only for interactive elements
- All API calls through `apiClient` — no raw `fetch()` in components or hooks
- JWT in httpOnly cookies only; CSRF token attached automatically by `apiClient`
- All forms must show loading state (`submitting`) and error state
- Dynamic `og:image`, `og:title`, `og:description` on vendor profile pages (WhatsApp sharing)
- Mobile-first CSS: 375px base, touch targets ≥44px, no hover-only interactions

---

## 5.5 Level 2 — `packages/config/`

```
packages/config/
├── eslint/
│   ├── base.js         Base ESLint rules (all packages)
│   ├── nextjs.js       Next.js specific rules
│   └── nestjs.js       NestJS specific rules
├── typescript/
│   ├── base.json       strict: true, noUncheckedIndexedAccess, exactOptionalPropertyTypes
│   ├── nextjs.json     extends base
│   └── nestjs.json     extends base
└── prettier/
    └── index.js        Shared Prettier config
```
