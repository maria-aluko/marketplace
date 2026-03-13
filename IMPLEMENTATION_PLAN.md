# EventTrust Nigeria — Implementation Plan

> **Monorepo:** Turborepo + pnpm | **ORM:** Prisma | **Validation:** Zod (shared) | **Current Phase:** 1 (Complete)

---

## Architecture

```
eventtrust/
├── apps/api/         # NestJS 11 backend → Railway
├── apps/web/         # Next.js 15 frontend → Vercel
├── packages/shared/  # @eventtrust/shared (types, enums, Zod schemas, constants)
└── packages/config/  # @eventtrust/config (shared ESLint, TS, Prettier)
```

- **Strict rule:** Next.js never accesses the database directly. All data flows through NestJS API.
- **Prisma ORM** connects to Supabase Postgres (pooled via PgBouncer, direct for migrations).
- **Zod schemas** in `@eventtrust/shared` validate on both frontend and backend.

---

## Tech Stack

| Layer    | Choice                             | Why                                              |
| -------- | ---------------------------------- | ------------------------------------------------ |
| API      | NestJS 11                          | Modular, guards/pipes/interceptors, DI           |
| Database | Supabase Postgres + Prisma ORM     | Type-safe queries, version-controlled migrations |
| OTP/SMS  | Termii                             | Nigerian provider, cheaper than Twilio           |
| Media    | Cloudinary                         | Signed URL uploads, CDN, auto-optimization       |
| Email    | Resend                             | Free tier: 3,000/month                           |
| Frontend | Next.js 15 (App Router)            | SSR for SEO, PWA for Android                     |
| Styling  | Tailwind CSS + shadcn/ui           | Mobile-first, accessible                         |
| Auth     | Phone OTP → JWT (httpOnly cookies) | Argon2 OTP hashing, refresh token rotation       |
| Testing  | Vitest, Supertest, Playwright      | Unit, E2E, browser tests                         |
| CI/CD    | GitHub Actions + Turborepo cache   | Lint → typecheck → test → build                  |

---

## Security Layers

| Layer              | Implementation                                     |
| ------------------ | -------------------------------------------------- |
| HTTP headers       | Helmet middleware                                  |
| Rate limiting      | @nestjs/throttler (global + per-endpoint)          |
| OTP brute force    | Max 5 verify attempts per OTP, exponential backoff |
| OTP hashing        | Argon2                                             |
| CSRF               | Double-submit cookie pattern                       |
| Refresh tokens     | Rotation with revocation detection                 |
| Cookies            | httpOnly + Secure + SameSite=Lax                   |
| Input sanitization | Strip HTML from text inputs                        |

---

## Database Schema

Full Prisma schema at `apps/api/prisma/schema.prisma`. Key models:

| Model                | Purpose                                                                            |
| -------------------- | ---------------------------------------------------------------------------------- |
| User                 | Phone, role (CLIENT/VENDOR/ADMIN), soft-delete                                     |
| AuthIdentity         | Multi-provider auth (phone now, Google/Facebook later)                             |
| OtpRequest           | Code hash, attempts counter, expiry                                                |
| RefreshToken         | Token hash, revocation tracking                                                    |
| Vendor               | Profile, status machine, ratings, subscriptionTier, soft-delete                    |
| Listing              | ListingType (SERVICE\|RENTAL), category, description, photos, vendorId             |
| ListingRentalDetails | quantity, pricePerDay, depositAmount, DeliveryOption, condition — 1:1 with Listing |
| VendorPortfolio      | Media items (max 10 images, 2 videos)                                              |
| Review               | Rating, body (min 50 chars), status, soft-delete                                   |
| VendorReply          | One reply per review, editable 48hrs                                               |
| Dispute              | Status machine (open → decided → appealed → closed)                                |
| AdminLog             | Append-only audit trail                                                            |

Key enums: `ListingType` (SERVICE\|RENTAL), `RentalCategory` (tent\|chairs_tables\|cooking_equipment\|generator\|lighting\|other_rental), `DeliveryOption` (pickup_only\|delivery_only\|both), `SubscriptionTier` (free\|pro\|pro_plus)

---

## Key Business Rules

- **Vendor status:** `draft → pending → active | changes_requested | suspended`
- **Reviews:** One per vendor per client per year. Min 50 chars. Vendor gets one reply (editable 48hrs).
- **Disputes:** Vendor raises within 72hrs. One appeal within 48hrs.
- **Search ranking:** `avg_rating × 0.5 + review_count_score × 0.3 + profile_completeness × 0.1 + recency × 0.1`
- **Phone numbers:** E.164 format (`+234XXXXXXXXXX`)
- **OTP:** Max 3 requests/phone/10 min. Max 5 verify attempts/OTP.

---

## Build Phases

### Phase 0: Monorepo Scaffold — COMPLETE

- [x] Turborepo + pnpm workspaces initialized
- [x] `@eventtrust/shared` — enums, types, constants, Zod schemas (15 tests passing)
- [x] `@eventtrust/config` — shared TypeScript config
- [x] `apps/api` — NestJS scaffold with Prisma, Helmet, ThrottlerModule, Pino, health endpoint
- [x] `apps/web` — Next.js 15 with Tailwind, typed apiClient, auth middleware
- [x] Prisma schema — 11 models, soft-delete extension
- [x] GitHub Actions CI pipeline
- [x] `scripts/check-env.ts` — env var validator
- [x] `pnpm turbo run build` — all packages build clean

---

### Phase 1: Auth + Vendor Foundation — COMPLETE

**Shared package:**

- [x] Auth types (`AccessTokenPayload`, `RefreshTokenPayload`, `AuthResponse`, `CsrfTokenResponse`, `OtpRequestResponse`)
- [x] Vendor types (`VendorStatusTransitionPayload`)
- [x] Constants (cookie names, CSRF header, OTP backoff, slug max length)
- [x] `vendorStatusTransitionSchema` Zod schema
- [x] 19 tests passing (4 new)

**Backend (NestJS):**

- [x] `AuditModule` — Append-only `log()` to `admin_log` table
- [x] `AuthModule` — OTP request (Argon2 hash + Termii SMS, rate limited 3/10min)
- [x] `AuthModule` — OTP verify (attempt tracking + exponential backoff)
- [x] `AuthModule` — JWT in httpOnly cookies (access 15m, refresh 7d)
- [x] `AuthModule` — Refresh token rotation with family-based revocation detection
- [x] `AuthModule` — JwtStrategy (cookie extractor), JwtAuthGuard (global APP_GUARD)
- [x] `AuthModule` — RolesGuard, VendorOwnerGuard, PhoneThrottlerGuard
- [x] `AuthModule` — `@Public()`, `@CurrentUser()`, `@Roles()` decorators
- [x] `AuthModule` — CSRF double-submit cookie middleware
- [x] `AuthModule` — `/auth/otp/request`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/csrf-token`
- [x] `VendorsModule` — Create draft vendor with slug generation
- [x] `VendorsModule` — Update profile (owner only via VendorOwnerGuard)
- [x] `VendorsModule` — Submit for review (draft → pending)
- [x] `VendorsModule` — Admin status change endpoint
- [x] `VendorsModule` — `VendorStatusService.transition()` with audit logging
- [x] `VendorsModule` — Profile completeness scoring
- [x] Global exception filter (Prisma error mapping: P2002→409, P2025→404)
- [x] 32 unit tests passing (auth service, vendor status, guards, audit)

**Frontend (Next.js):**

- [x] shadcn/ui components (Button, Input, Label, Card, Badge)
- [x] Layout shell (Header with mobile nav, Footer)
- [x] `AuthProvider` context + `useAuth` hook
- [x] `apiClient` with CSRF token handling + auto-refresh on 401
- [x] Login page with OTP request → verify flow (6-digit auto-focus, paste, resend timer)
- [x] Vendor signup 4-step form (business info → details → contact → review)
- [x] Dashboard page (profile info, vendor status)
- [x] Middleware protecting `/vendor/signup`, `/dashboard`
- [x] 13 tests passing (OTP forms, vendor signup, home page)

- [x] Run Prisma migrations against Supabase (migration `20260312091718_init` applied, tables visible in Supabase)
- [x] Seed dev data (`apps/api/prisma/seed.ts` — seed data visible in Supabase)

**Code Review Fixes Applied (post-Phase 1 audit):**

- [x] Added `auditService.log({ action: 'vendor.updated', ... })` in `VendorsService.update()` — was missing, violating "every state-changing endpoint calls AuditService" rule
- [x] Made `VendorsService.toResponse()` public; called it in `VendorsController.updateStatus()` — was returning raw Prisma object with uppercase enums (`status: 'ACTIVE'`) instead of normalized response (`status: 'active'`)
- [x] Added 4 Phase 2 enums to `@eventtrust/shared` (`ListingType`, `RentalCategory`, `DeliveryOption`, `SubscriptionTier`) — required by CLAUDE.md, needed before Phase 2 work begins

**Still TODO (deferred):**

- [ ] E2E tests (write + run against live DB)

**Test summary:**

```
Shared:  35 tests (1 file)   — +16 listing schema tests
API:     51 tests (7 files)  — +19 (ListingsService 14, ListingOwnerGuard 5)
Web:     49 tests (13 files) — +32 Phase 2 Track B frontend tests
Total:   135 tests — all passing
Build:   pnpm turbo run build — clean
```

---

### Phase 2: Listings + Portfolio + Reviews + Search (Weeks 4–8)

#### Track A — Listings (new scope)

**Shared package:**

- [x] `ListingType`, `RentalCategory`, `DeliveryOption`, `SubscriptionTier` enums (added in Phase 1 audit)
- [x] `CreateServiceListingPayload`, `CreateRentalListingPayload`, `ListingResponse` types + update/rental-details types
- [x] `createServiceListingSchema`, `createRentalListingSchema`, `updateServiceListingSchema`, `updateRentalListingSchema` Zod schemas
- [x] Listing limit constants (`LISTING_MAX_PHOTOS`, tier limits, title/description lengths)
- [x] 16 new validation tests for listing schemas (35 total in shared)

**Backend:**

- [x] Prisma: `Listing` model + `ListingRentalDetails` 1:1 model (migration pending — run `prisma migrate dev`)
- [x] Prisma: `subscriptionTier` field on Vendor (schema-only, default `FREE`)
- [x] Prisma: 4 new enums (`ListingType`, `RentalCategory`, `DeliveryOption`, `SubscriptionTier`)
- [x] `Listing` added to soft-delete extension in `PrismaService`
- [x] `ListingOwnerGuard` — async guard with DB lookup, admin bypass
- [x] `ListingsModule` — create/update/delete service listing (owner only via ListingOwnerGuard)
- [x] `ListingsModule` — create/update/delete rental listing (owner only, with rental details in transaction)
- [x] `ListingsModule` — GET /listings/:id (public), GET /vendors/:vendorId/listings (public)
- [x] Vendor status check: only ACTIVE vendors can create listings (ForbiddenException)
- [x] Audit logging on all listing create/update/delete operations
- [x] Seed data updated with 2 service listings + 1 rental listing
- [ ] Search: extend `SearchModule` to query `listings` table, filter by `listingType`, `rentalCategory` (deferred to Track B)

**Frontend:**

- [x] Dashboard — "Manage Listings" card linking to `/dashboard/listings`
- [x] Vendor dashboard — listing management UI with type badges, delete, add service/rental buttons
- [x] `ServiceListingForm` — client component with Zod validation, category dropdown
- [x] `RentalListingForm` — client component with rental-specific fields (quantity, pricePerDay, deliveryOption, rentalCategory)
- [x] Route pages: `/dashboard/listings/new/service`, `/dashboard/listings/new/rental`
- [x] Listing detail page (SSR with `generateMetadata` for og:title/og:description, WhatsApp contact button)

**Tests:**

- [x] Unit: ListingsService — 14 tests (create service/rental, update, soft-delete, findById, findByVendorId)
- [x] Unit: ListingOwnerGuard — 5 tests (owner, non-owner, admin, not found, no user)
- [x] Frontend: ServiceListingForm — 4 tests (renders, validates, submits, shows errors)

---

#### Track B — Portfolio, Reviews, Search (existing Phase 2 scope)

**Shared package:**

- [x] Portfolio types (`PortfolioItem`, `SignedUploadResponse`, `ConfirmUploadPayload`), review types (`CreateReviewPayload`, `ReviewResponse`, `VendorReplyResponse`, `CreateVendorReplyPayload`), search types (`SearchVendorsQuery`, `SearchVendorsResponse`)
- [x] Remaining Zod schemas: `createReviewSchema`, `createVendorReplySchema`, `confirmUploadSchema`, `searchVendorsSchema`
- [x] Ranking weight constants (`RANKING_WEIGHTS`, `MAX_REVIEW_COUNT_FOR_RANKING`)
- [x] Review/dispute constants (`REVIEW_MIN_BODY_LENGTH`, `VENDOR_REPLY_EDIT_WINDOW_HOURS`, `DISPUTE_RAISE_WINDOW_HOURS`, etc.)
- [x] Portfolio constants (`PORTFOLIO_MAX_IMAGES`, `PORTFOLIO_MAX_VIDEOS`)

**Backend:** — COMPLETE

- [x] `PortfolioModule` — Signed Cloudinary URL generation
- [x] `PortfolioModule` — Upload confirmation (validates limits: 10 images, 2 videos)
- [x] `PortfolioModule` — Delete portfolio item
- [x] `ReviewsModule` — Submit review (one-per-year rule, min 50 chars)
- [x] `ReviewsModule` — ReviewScoreService.recalculate()
- [x] `ReviewsModule` — Vendor reply (one per review, 48h edit window)
- [x] `SearchModule` — Ranked SQL query with 4-factor scoring
- [x] `SearchModule` — Filters (category, area, keyword, verified-only, listingType)
- [x] `SearchModule` — Cursor pagination
- [x] `NotificationsModule` — Resend email + Termii SMS templates (internal only)
- [x] Admin endpoints: review queue, approve, remove

**Frontend:** — COMPLETE

- [x] shadcn/ui components: textarea, select, skeleton, tabs, dialog, progress, dropdown-menu (Radix UI deps installed)
- [x] `StarRating` component — interactive/readonly, configurable size (4 tests)
- [x] `VendorCard` component — image, category badge, area, star rating, review count, price range (3 tests)
- [x] `serverFetchRaw<T>()` — server-side fetch without `.data` unwrapping (for search endpoint)
- [x] Search page `/search` — text search, category/area `Select` filters, `verifiedOnly` checkbox, URL sync via `useSearchParams`, infinite scroll with `IntersectionObserver`, skeleton loading, empty state (4 tests)
- [x] Vendor profile page `/vendors/[slug]` — SSR with dynamic OG tags (`generateMetadata`), parallel data fetching (`Promise.all`), hero/about/listings/portfolio/reviews sections
- [x] `ListingCard` component — service/rental type badges, price display, rental details
- [x] `PortfolioGallery` — grid (2→3→4 cols), lightbox `Dialog` for images/videos (3 tests)
- [x] `ReviewsList` — approved reviews with vendor replies, date formatting
- [x] `WriteReviewButton` — auth-aware (hidden for vendors, sign-in prompt for guests)
- [x] `EnquiryButton` — WhatsApp `wa.me` link with pre-filled message, green styling
- [x] `ShareButton` — `DropdownMenu` with WhatsApp share, copy link (clipboard), native share
- [x] `VendorActionBar` — fixed bottom bar on mobile (`md:hidden`), inline on desktop
- [x] Review submission page `/reviews/new/[vendorId]` — server wrapper with vendor info
- [x] `ReviewForm` — interactive `StarRating`, `Textarea` with char count, Zod validation, success/error states (5 tests)
- [x] Dashboard restructured with `Tabs` (Overview | Profile | Portfolio | Reviews) for vendor users
- [x] `ProfileEditForm` — loads vendor data, edits all fields, `changes_requested` alert + resubmit button (3 tests)
- [x] `PortfolioManager` — grid display with delete confirmation `Dialog`, image/video counts vs limits
- [x] `PortfolioUploader` — drag-and-drop zone, file type/size validation, 3-step Cloudinary upload (signed URL → XHR with `Progress` bar → confirm), caption per item (5 tests)
- [x] `ReviewsManager` — reply flow (new reply / edit within 48h / expired), Zod validation (5 tests)
- [x] Home page updated — hero search bar → `/search`, category grid items linked to `/search?category=...`
- [x] `AuthNavLinks` client component — auth-aware nav (Find Vendors→`/search`, Dashboard, Sign Out vs Find Vendors, List Your Business, Sign In)
- [x] Header + MobileNav refactored to use `AuthNavLinks`

**Tests:**

- [ ] Unit: PortfolioService (limits, ownership)
- [ ] Unit: ReviewsService (duplicate check, scoring)
- [ ] Unit: SearchService (ranking, filters, exclusions, listingType filter)
- [ ] Unit: VendorReply (48h window)
- [ ] E2E: Full review flow (client OTP → submit → admin approve → score update)
- [ ] E2E: Search ranking
- [ ] E2E: Portfolio upload
- [x] Frontend: StarRating — 4 tests (renders, fills, onChange, readonly)
- [x] Frontend: VendorCard — 3 tests (renders info, links to slug, shows price)
- [x] Frontend: SearchPageClient — 4 tests (renders filters, fetches vendors, triggers search, empty state)
- [x] Frontend: PortfolioGallery — 3 tests (renders grid, empty state, opens lightbox)
- [x] Frontend: ReviewForm — 5 tests (renders, validates min length, validates rating, submits, shows API error)
- [x] Frontend: ProfileEditForm — 3 tests (loads data, validates, submits)
- [x] Frontend: PortfolioUploader — 5 tests (drop zone, file input, validates type, enforces limit, queues files)
- [x] Frontend: ReviewsManager — 5 tests (loads reviews, reply button, opens form, edit button, submits reply)
- [ ] Playwright: Search → click vendor → verify profile content
- [ ] Playwright: Submit review flow

**Status:** Backend + Shared + Frontend all COMPLETE. Backend tests and E2E tests still TODO.

**Exit criteria:**

```bash
pnpm turbo run test && pnpm turbo run test:e2e
# Search returns ranked results with correct ordering, filterable by listing type ✓ (frontend wired)
# Vendor can create service + rental listings from dashboard ✓
# Review flow works end-to-end, score updates on vendor profile ✓ (frontend wired, backend tests TODO)
# Portfolio upload works on mobile 4G ✓ (frontend 3-step Cloudinary flow complete)
# WhatsApp share shows preview card ✓ (dynamic OG tags on /vendors/[slug])
```

**New file manifest (Phase 2 Track B Frontend):**

| File (relative to `apps/web/src/`) | Type |
|---|---|
| `components/ui/textarea.tsx` | UI component |
| `components/ui/select.tsx` | UI component |
| `components/ui/skeleton.tsx` | UI component |
| `components/ui/tabs.tsx` | UI component |
| `components/ui/dialog.tsx` | UI component |
| `components/ui/progress.tsx` | UI component |
| `components/ui/dropdown-menu.tsx` | UI component |
| `components/ui/star-rating.tsx` | Component (4 tests) |
| `components/vendor/vendor-card.tsx` | Component (3 tests) |
| `components/vendor/listing-card.tsx` | Component |
| `components/vendor/portfolio-gallery.tsx` | Component (3 tests) |
| `components/vendor/reviews-list.tsx` | Component |
| `components/vendor/write-review-button.tsx` | Component |
| `components/vendor/enquiry-button.tsx` | Component |
| `components/vendor/share-button.tsx` | Component |
| `components/vendor/vendor-action-bar.tsx` | Component |
| `components/search/search-page-client.tsx` | Component (4 tests) |
| `components/reviews/review-form.tsx` | Component (5 tests) |
| `components/dashboard/profile-edit-form.tsx` | Component (3 tests) |
| `components/dashboard/portfolio-manager.tsx` | Component |
| `components/dashboard/portfolio-uploader.tsx` | Component (5 tests) |
| `components/dashboard/reviews-manager.tsx` | Component (5 tests) |
| `components/layout/auth-nav-links.tsx` | Component |
| `app/search/page.tsx` | Page |
| `app/vendors/[slug]/page.tsx` | Page (SSR) |
| `app/reviews/new/[vendorId]/page.tsx` | Page |

**Modified files:**

| File | Change |
|---|---|
| `lib/server-api.ts` | Added `serverFetchRaw<T>()` |
| `app/page.tsx` | Hero search bar, category links to `/search` |
| `app/page.test.tsx` | Added `useRouter` mock |
| `app/dashboard/page.tsx` | Tabs for vendor dashboard (Overview/Profile/Portfolio/Reviews) |
| `components/layout/header.tsx` | Uses `AuthNavLinks` client component |
| `components/layout/mobile-nav.tsx` | Uses `AuthNavLinks` with mobile styling |

---

### Phase 3: Vendor Business Tools + Trust Layer (Weeks 9–12)

**Subscription enforcement:**

- [ ] `SubscriptionsModule` — tier enforcement (listing/photo limits by tier: free=1 listing+3 photos, pro=10+20, pro_plus=unlimited)

**Vendor business tools:**

- [ ] CRM: customer records (name, event date, contact, quote status, notes) per vendor
- [ ] Booking calendar: date-based availability for service vendors
- [ ] Inventory management: quantityBooked tracking for rental vendors
- [ ] Invoicing: PDF generation, payment link, receipt

**Trust layer (disputes + admin):**

- [ ] `DisputesModule` — Submit dispute (vendor only, within 72h)
- [ ] `DisputesModule` — Evidence upload
- [ ] `DisputesModule` — Admin decide (with policy clause + audit)
- [ ] `DisputesModule` — Appeal (one, within 48h)
- [ ] `DisputesModule` — Status machine
- [ ] `AdminModule` — Full queues (vendors, reviews, disputes)
- [ ] `AdminModule` — Analytics endpoint (rental listing count, service listing count, avg listings per vendor)
- [ ] `AdminModule` — All actions call AuditService
- [ ] Dispute email notifications (opened, evidence, decided, appealed)
- [ ] CORS hardened for production

**Frontend:**

- [ ] Dispute form + evidence upload
- [ ] Admin dashboard (vendor queue, review queue, dispute queue, analytics)
- [ ] Vendor dashboard: CRM, calendar, inventory, invoicing
- [ ] Public policy page (static)
- [ ] Transparency report page
- [ ] PWA: manifest.json, service worker, Android install prompt

**Tests:**

- [ ] Unit: DisputesService (72h window, evidence parties, appeal limits)
- [ ] Unit: SubscriptionsService (tier limit enforcement)
- [ ] Unit: Admin analytics
- [ ] E2E: Full dispute lifecycle (review → dispute → evidence → decide → appeal → close)
- [ ] E2E: Audit log completeness
- [ ] Playwright: Admin approves vendor, admin decides dispute

**Exit criteria:**

```bash
pnpm turbo run test && pnpm turbo run test:e2e
# Full dispute lifecycle works end-to-end
# Every admin action logged in audit_log
# Free tier vendors blocked from creating >1 listing
# PWA installs on Android Chrome
# Service worker caches vendor profiles for offline viewing
```

---

### Phase 4: Performance, Security Audit, Launch (Weeks 11–12)

**Performance:**

- [ ] Bundle analysis (target: <100KB main JS gzipped, <250KB total)
- [ ] Cloudinary `f_auto,q_auto` transformations
- [ ] `font-display: swap`, system font fallback
- [ ] Lazy loading for below-fold images
- [ ] ISR for top vendor profiles (1h revalidation)

**SEO:**

- [ ] Dynamic og:image per vendor (Cloudinary text overlay)
- [ ] sitemap.xml from active vendor slugs
- [ ] robots.txt, JSON-LD structured data (LocalBusiness schema)

**Security audit:**

- [ ] Scan all routes for correct guard metadata
- [ ] OTP rate limiting stress test
- [ ] File upload MIME type validation
- [ ] CSRF on all mutating endpoints
- [ ] Cookie flag verification (httpOnly, Secure, SameSite)
- [ ] Input sanitization (no stored XSS)

**Launch:**

- [ ] Manual onboarding of 30–50 Lagos vendors
- [ ] Landing page with value prop
- [ ] Soft launch to Lagos bridal WhatsApp communities

**Tests:**

- [ ] Lighthouse CI: Performance >70, Accessibility >90, Best Practices >90, SEO >90
- [ ] Bundle size assertion (fail if >100KB gzipped)
- [ ] 3G load test via Playwright (vendor profile <5s on Slow 3G)
- [ ] Security: guard coverage, CSRF rejection, cookie flags, rate limit verification
- [ ] Production smoke: health check, search, SSR vendor page, OTP flow

**Exit criteria:**

```bash
pnpm turbo run test && pnpm turbo run test:e2e
# Lighthouse scores above thresholds
# Bundle under budget
# 30+ active vendors, 5+ real reviews
# No Sentry errors in first 24h of soft launch
# PWA installable, WhatsApp shares work
```

---

## CI/CD Pipeline

### ci.yml (on push + PRs)

1. Checkout + pnpm install (Turborepo cache)
2. `turbo run lint`
3. `turbo run typecheck`
4. `turbo run test` (unit + integration)
5. `turbo run build`
6. `turbo run test:e2e` (main branch only)

### deploy.yml (on push to main)

- **Vercel:** auto-deploys `apps/web`, preview deploys on PRs
- **Railway:** auto-deploys `apps/api`

---

## Environment Variables

### apps/api

```
DATABASE_URL                # Supabase pooled (PgBouncer)
DIRECT_DATABASE_URL         # Direct (migrations only)
JWT_SECRET                  # Random 64 chars
JWT_REFRESH_SECRET          # Random 64 chars
TERMII_API_KEY
TERMII_SENDER_ID=EventTrust
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY
FRONTEND_URL
SENTRY_DSN
NODE_ENV
PORT=4000
```

### apps/web

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
SENTRY_AUTH_TOKEN
```

---

## Risks & Mitigations

| Risk                          | Mitigation                                                            |
| ----------------------------- | --------------------------------------------------------------------- |
| Termii SMS failures           | Retry 3x with backoff. Log all responses. WhatsApp OTP fallback.      |
| Supabase connection limits    | PgBouncer pooled connection. Small pool (5). Health check monitoring. |
| Cloudinary bandwidth exceeded | Aggressive f_auto,q_auto. Budget $10/month for paid tier.             |
| Railway free tier hours       | Monitor hours. Upgrade to Hobby ($5/month) before launch.             |
| Slow 3G in Lagos              | Bundle budget in CI. Service worker caching. SSR. Throttled 3G tests. |
| Vendor onboarding drop-off    | Keep signup <10 min. Manual outreach. WhatsApp-based support.         |

---

## MVP Success Metrics (Month 3)

| Metric                    | Target | V2-justified |
| ------------------------- | ------ | ------------ |
| Active verified vendors   | 50+    | 100+         |
| Service listings created  | 50+    | 200+         |
| Rental listings created   | 20+    | 100+         |
| Avg listings per vendor   | 1.5+   | 3+           |
| Client review submissions | 30+    | 100+         |
| Monthly unique visitors   | 500+   | 2,000+       |
| Vendor enquiry clicks     | 100+   | 500+         |
| Profile completion rate   | >70%   | >85%         |
| Dispute rate              | <10%   | <5%          |
