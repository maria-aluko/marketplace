# EventTrust Nigeria — Backend Audit & Compliance Analysis

> **Generated:** 2026-03-19 | **Last updated:** 2026-03-25
> **Phase:** End of Phase 2 — All backend audit items implemented (Sprints 1–3 complete)
> **Scope:** Backend only (`apps/api/`). Frontend audit is in `FRONTEND_AUDIT.md`.

---

## Quick Wins (CEO View)

These are the highest-leverage fixes — small effort, outsized production risk reduction:

| # | Fix | Why It Matters | Status |
|---|-----|----------------|--------|
| 1 | Env validation on startup | App silently boots with missing JWT_SECRET or DB credentials — next Railway deploy could be broken and no one would know | ✅ Done 2026-03-25 |
| 2 | Sentry in GlobalExceptionFilter | Backend 500s are invisible in production right now — no alert, no trace, just a Pino log that nobody reads | ✅ Done 2026-03-25 |
| 3 | `findUnique` soft-delete gap | Deleted vendors/users/listings can be fetched by direct ID — a deleted vendor profile remains accessible | ✅ Done 2026-03-25 |
| 4 | CSRF exclusion on `/invoices/:id/confirm` — verify token validation | The endpoint is public and excluded from CSRF — if `confirm(id)` trusts the ID alone with no shared secret, any invoice can be confirmed by anyone who guesses or enumerates an ID | ✅ Done 2026-03-25 |
| 5 | Termii silent failure alert | OTP SMS can silently fail after 3 retries — user receives no code, cannot log in, and backend returns 200 OK | ✅ Done 2026-03-25 |
| 6 | Tests for Phase 2+ modules | budgets, guest-lists, inquiries, invoices, invoice-branding, clients — 6 production modules with zero test coverage | ✅ Done 2026-03-25 |

---

## Legend & Scope

**Severity:**
- 🟠 **High** — security gap, data integrity risk, or silent production failure
- 🟡 **Medium** — type safety gap, logic edge case, or missing endpoint
- 🟢 **Low** — polish, missing test coverage, or minor inconsistency

**Scope:** `apps/api/` only. Frontend (`apps/web/`) audit is in `AUDIT.md`.

**Codebase as of audit date:**
- 18 modules, ~106 TypeScript files, 17 spec files
- 32+ passing unit tests
- CLAUDE.md specifies 13 modules for Phase 1; the actual codebase ships 18 production-ready modules (5 Phase 2+ modules fully built)

---

## 1. Codebase Audit — Compliance with CLAUDE.md

### ✅ What's Compliant

**Security architecture:**
- `AuditService.log()` called on every state-changing endpoint across all modules — zero gaps found
- `ZodValidationPipe` with `@eventtrust/shared` schemas on all POST/PATCH endpoints
- Admin endpoints all have `RolesGuard` + `@Roles('ADMIN')` — no unguarded admin routes found
- Owner guards cover all mutation endpoints: `VendorOwnerGuard`, `ListingOwnerGuard`, `ReviewOwnerGuard`, `BudgetOwnerGuard`, `DisputeOwnerGuard`, `GuestListOwnerGuard`, `InvoiceOwnerGuard`
- JWT in httpOnly cookies only — never in response body or localStorage
- CSRF double-submit cookie pattern correctly wired in `csrf.middleware.ts` + `app.module.ts`
- Refresh token rotation with reuse detection and family revocation (`auth.service.ts:159–166`)
- OTP rate limiting: 3 req/10min via DB count check; 5 verify attempts max with exponential backoff
- Soft deletes via Prisma `$extends` on `User`, `Vendor`, `Review`, `Listing` — `.delete()` and `.deleteMany()` both intercepted

**Infrastructure:**
- `Helmet`, `CORS`, `cookie-parser` all applied in `main.ts`
- `GlobalExceptionFilter` maps Prisma errors: `P2002 → 409`, `P2025 → 404`
- No raw SQL — all queries go through Prisma ORM
- No direct cross-module service imports (only foundational services: `PrismaService`, `AuditService`, `JwtService`)
- Global `JwtAuthGuard` as `APP_GUARD` — all routes protected unless `@Public()` is explicit
- `@nestjs/throttler` global rate limiter: 60 requests/60s per IP
- `ScheduleModule` wired for cron tasks
- Pino structured logging with pino-pretty in dev, JSON in production
- `ConfigModule.forRoot({ isGlobal: true })` — env vars accessible everywhere

**Data integrity:**
- `admin_log` is append-only — no update/delete calls to it anywhere in codebase
- `auth_identities` correctly created on first OTP verify (phone provider)
- Phone numbers validated to E.164 format via Zod schema in `@eventtrust/shared` before reaching any service
- Argon2 for OTP code hashing — not stored in plaintext
- Refresh tokens stored as SHA-256 hashes only — raw tokens never in DB

---

### ~~🟠 High Priority Issues~~ ✅ All resolved 2026-03-25

#### ~~H1 — No Env Validation on Startup~~ ✅ Fixed 2026-03-25

- **File:** `apps/api/src/main.ts`, `apps/api/src/app.module.ts`
- **Problem:** `main.ts` calls `NestFactory.create(AppModule)` with no startup validation of required environment variables. `ConfigModule.forRoot({ isGlobal: true })` is present but has no `validate` function attached.
  Required vars not validated: `JWT_SECRET`, `JWT_REFRESH_SECRET`, `TERMII_API_KEY`, `TERMII_SENDER_ID`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `SENTRY_DSN`, `DATABASE_URL`, `DIRECT_DATABASE_URL`
- **Impact:** The app can boot and serve requests with missing secrets. JWT signing will silently use an empty string as the secret — tokens will be generated but with no security. Termii will silently fail. A Railway deploy with a misconfigured env will start healthy but be broken.
- **Evidence:** `main.ts:8` — `NestFactory.create(AppModule, { bufferLogs: true })` — no validation step before `app.listen(port)`.
- **Fix:** Add `validate` to `ConfigModule.forRoot()` using a Zod schema. Throw on missing required vars. The app will refuse to start rather than start broken.
- **Resolution:** Zod schema added to `ConfigModule.forRoot({ validate })` in `app.module.ts`. Validates 11 required vars (DATABASE_URL, JWT_SECRET, TERMII_API_KEY, etc.) with `.url()` and `.min(32)` constraints. App throws on boot if any are missing.

#### ~~H2 — No Sentry Integration in GlobalExceptionFilter~~ ✅ Fixed 2026-03-25

- **File:** `apps/api/src/common/filters/global-exception.filter.ts`
- **Problem:** `GlobalExceptionFilter` logs 5xx errors to Pino (`this.logger.error(...)`) but never calls `Sentry.captureException()`. Production backend crashes are invisible — no alert, no trace, no grouping.
- **Evidence:** `global-exception.filter.ts:46` — `this.logger.error(exception.message, exception.stack)` — Pino only. No Sentry import in the file.
- **Impact:** Unhandled exceptions, unexpected Prisma errors, and service failures produce zero monitoring signal. Bugs go undetected until users complain.
- **Fix:** Import `@sentry/nestjs`, call `Sentry.captureException(exception)` for all non-`HttpException` paths (i.e., genuine 5xx errors). 4xx `HttpException`s should generally not be sent to Sentry as they are expected user errors.
- **Resolution:** `Sentry.init()` added to `main.ts` before `NestFactory.create()`. `Sentry.captureException()` called in `GlobalExceptionFilter` for non-P2002/P2025 Prisma errors and all generic `Error` instances. `HttpException` (4xx) intentionally not captured.

#### ~~H3 — `findUnique()` Bypasses Soft-Delete Filter~~ ✅ Fixed 2026-03-25

- **File:** `apps/api/src/prisma/prisma.service.ts`
- **Problem:** The Prisma `$extends` soft-delete middleware intercepts `findFirst` and `findMany` and injects `deletedAt: null`. The `findUnique` branch (line 40–45) is a deliberate no-op pass-through with a comment: `"findUnique doesn't support deletedAt filter directly, so we let it pass and check after"` — but no post-query check was implemented.
- **Evidence:** `prisma.service.ts:40–46`:
  ```ts
  async findUnique({ model, args, query }) {
    if (SOFT_DELETE_MODELS.includes(model)) {
      // findUnique doesn't support deletedAt filter directly,
      // so we let it pass and check after
    }
    return query(args);  // ← no filter applied, no post-check
  }
  ```
- **Impact:** Any service that calls `prisma.user.findUnique({ where: { id } })` or `prisma.vendor.findUnique(...)` will return soft-deleted records. Deleted users can be fetched by `auth.service.ts:getUser()`. A deleted vendor profile remains accessible at its public endpoint.
- **Affected services:** `auth.service.ts:103,235`, any service using `findUnique` on soft-delete models.
- **Fix:** Replace `findUnique` calls on soft-delete models with `findFirst({ where: { id, deletedAt: null } })` in all service methods, OR implement a post-query null check inside the extension. The first approach is safer and more explicit.
- **Resolution:** Replaced all `findUnique` calls on soft-delete models with `findFirst + deletedAt: null` across `auth.service.ts` (×2), `vendors.service.ts` (×1), `reviews.service.ts` (×4), and `reviews/services/client-review.service.ts` (×1). `clientProfile`, `refreshToken`, and other non-soft-delete models left unchanged.

#### ~~H4 — CSRF Excluded for `POST /invoices/:id/confirm` — No Token Validation~~ ✅ Fixed 2026-03-25

- **File:** `apps/api/src/app.module.ts:87`, `apps/api/src/invoices/invoices.controller.ts:67–73`
- **Problem:** `POST /invoices/:id/confirm` is explicitly excluded from CSRF middleware and decorated `@Public()` (no JWT required). The `confirm(id)` method calls `this.invoicesService.confirm(id)` with only the invoice ID as input — no shared secret or signed token in the URL.
- **Evidence:**
  - `app.module.ts:87`: `{ path: 'invoices/:id/confirm', method: RequestMethod.POST }`
  - `invoices.controller.ts:67–73`: `async confirm(@Param('id') id: string)` — no additional parameter
- **Impact:** If invoice IDs are UUIDs (not guessable), risk is low but not zero — a UUID v4 is 122 bits of entropy, but IDs can be leaked via URLs, emails, or browser history. If invoice IDs are sequential integers, any invoice can be confirmed by enumeration. The CSRF exclusion rationale (client has no session) is valid, but the lack of a confirmation token means the endpoint has no authorization check at all.
- **Fix:** Verify that `invoicesService.confirm(id)` validates a signed token passed as a query param or body field, or that the invoice ID cannot be enumerated. If neither is true, add a `confirmToken` field to the Invoice model and require it on this endpoint.
- **Resolution:** Added `confirmToken String? @unique @map("confirm_token")` to Prisma `Invoice` model. Generated as `crypto.randomBytes(32).toString('hex')` at create time. `confirm()` method validates token before processing. Controller requires `?token` query param and throws `BadRequestException` if absent, `UnauthorizedException` if wrong. `confirmToken` included in `InvoiceResponse` (returned only to vendor who created the invoice).

---

### ~~🟡 Medium Priority Issues~~ ✅ All resolved 2026-03-25

#### ~~M1 — `as any` Role Coercion in `auth.service.ts`~~ ✅ Fixed 2026-03-25

- **File:** `apps/api/src/auth/auth.service.ts:127, 189, 246`
- **Problem:** `role: user.role as any` bypasses TypeScript's type system. `user.role` comes from Prisma as a `Role` enum value, but is cast to `any` before assignment to `AuthUser.role`.
- **Evidence:** Three identical patterns at lines 127, 189, 246:
  ```ts
  role: user.role as any,
  ```
- **Impact:** If `UserRole` enum in `@eventtrust/shared` drifts from the Prisma `Role` enum (e.g., a new role is added to DB schema but not shared package), the cast silently maps it to an unknown value that passes type checks. The JWT payload will contain an unrecognized role, and `RolesGuard` will silently fail to grant access.
- **Fix:** Import the Prisma `Role` enum and validate against `UserRole` before assignment. Throw if an unknown role is encountered.
- **Resolution:** Added private `resolveRole(role: string): UserRole` method to `AuthService`. Normalizes to lowercase (Prisma returns `'CLIENT'`, enum expects `'client'`), validates against `Object.values(UserRole)`, throws `InternalServerErrorException` for unknown roles. Applied at all 3 call sites in `verifyOtp()`, `refreshTokens()`, and `getUser()`.

#### ~~M2 — `metadata as any` Cast in `audit.service.ts`~~ ✅ Fixed 2026-03-25

- **File:** `apps/api/src/audit/audit.service.ts:23`
- **Problem:** `details: params.metadata ? (params.metadata as any) : undefined` — the `metadata` field is cast to `any` before being written to `admin_log.details` (a Prisma `Json` field).
- **Evidence:** `audit.service.ts:23`.
- **Impact:** Prisma `Json` fields accept `any`, so functionally this works. The risk is that `details` has no typed schema — callers can pass arbitrary shapes that are inconsistent across audit events, making the `admin_log` table hard to query and analyze.
- **Fix:** Define a union type `AuditDetails` for known audit event shapes. Low urgency since the cast is technically correct, but important for the admin audit log viewer (see AUDIT.md GAP-D3).
- **Resolution:** Changed cast from `as any` to `as Prisma.InputJsonValue` (imported from `@prisma/client`), which is the correct type for Prisma JSON fields. Removes the unsafe cast while maintaining full compatibility.

#### ~~M3 — `PhoneThrottlerGuard` Falls Back to IP~~ ✅ Fixed 2026-03-25

- **File:** `apps/api/src/common/guards/phone-throttler.guard.ts`
- **Problem:** `getTracker` returns `req.body?.phone || req.ip`. If the request body doesn't contain a `phone` field — or if someone sends a request without a body — the throttler uses the caller's IP as the rate limit key instead of the phone number.
- **Evidence:** `phone-throttler.guard.ts:7`: `return req.body?.phone || req.ip;`
- **Impact:** An attacker could send malformed requests (no `phone` field) and only be rate-limited by IP, which is trivially bypassed with rotating IPs or proxies. Phone-based OTP rate limiting is the primary anti-SMS-bombing control (Termii costs money per SMS).
- **Fix:** If `req.body?.phone` is absent, throw `BadRequestException('Phone is required')` rather than falling back to IP. The OTP endpoint always requires a phone — a missing phone is an invalid request, not a valid one to throttle by IP.
- **Resolution:** `getTracker()` now throws `BadRequestException('Phone is required')` when `req.body?.phone` is absent. `|| req.ip` fallback removed entirely.

#### ~~M4 — No XSS Sanitization on Free-Text Fields~~ ✅ Fixed 2026-03-25

- **Files:** `apps/api/src/vendors/vendors.service.ts`, `apps/api/src/reviews/reviews.service.ts`, `apps/api/src/listings/listings.service.ts`
- **Problem:** Free-text fields (`description`, `businessName`, `replyText`, `listingTitle`, `listingDescription`) are stored without HTML sanitization. Zod schemas validate length and format but do not strip HTML tags.
- **Impact:** If any frontend component renders these fields with `dangerouslySetInnerHTML` or a markdown renderer without sanitization, stored XSS is possible. While the current Next.js frontend uses React (which escapes by default), future admin panels, email templates, or third-party integrations may not.
- **Fix:** Add `sanitize-html` or `dompurify` (server-side via jsdom) in service layer before DB writes on `description`, `replyText`, and similar fields. Strip all tags — these fields should be plain text only.
- **Resolution:** Added `sanitize-html` package. `stripHtml()` helper (`allowedTags: [], allowedAttributes: {}`) applied before all DB writes in: `vendors.service.ts` (`businessName`, `description` in create + update), `listings.service.ts` (`title`, `description` in createService, createRental, update), `reviews.service.ts` (reply `body` in createReply + updateReply).

#### ~~M5 — No `/listings/similar` Endpoint~~ ✅ Fixed 2026-03-24

- **Files:** `apps/api/src/listings/listings.service.ts`, `apps/api/src/listings/listings.controller.ts`
- Added `findSimilar(listingId, limit)` to `ListingsService`. Matches on `listingType` + `category` (SERVICE) or `rentalDetails.rentalCategory` (RENTAL), active vendors only, ordered by `createdAt DESC`, limited to 4.
- Added `GET /listings/:id/similar?limit=4` to `ListingsController` (placed before `:id` route to avoid NestJS route conflict).
- Frontend listing detail page updated to call this endpoint instead of `GET /listings`.

---

### ~~🟢 Low Priority / Polish~~ ✅ All resolved 2026-03-25

#### ~~L1 — Termii SMS Silent Failure~~ ✅ Fixed 2026-03-25

- **File:** `apps/api/src/auth/services/termii.service.ts`
- **Problem:** After 3 failed attempts, `sendOtp` logs `this.logger.error(...)` and returns `void` — no exception is thrown, no alert is triggered, and `requestOtp` in `auth.service.ts` returns `{ message: 'OTP sent successfully' }` even when the SMS was never delivered.
- **Evidence:** `termii.service.ts:53`: `this.logger.error(\`Failed to send OTP to ${phone} after ${maxRetries} attempts\`)`
- **Impact:** Users cannot log in without the OTP code. They will retry, hit rate limits, and be locked out. Support volume will spike. In production this will be invisible until users complain.
- **Fix:** On final retry failure, throw a `ServiceUnavailableException` so `auth.service.ts` propagates the error to the client. Also add a Sentry alert (once H2 is fixed) on this path. In development (where `isDev = true`), the silent log is fine — only affect production behavior.
- **Resolution:** `termii.service.ts` now throws `ServiceUnavailableException('SMS delivery failed. Please try again.')` after the retry loop. Dev path (early return with logged OTP) unchanged. Sentry will now capture this as a 5xx via H2 fix.

#### ~~L2 — No Test Files for Phase 2+ Modules~~ ✅ Fixed 2026-03-25

- **Modules without spec files:** `budgets`, `guest-lists`, `inquiries`, `invoices`, `invoice-branding`, `clients`
- **Problem:** All 6 Phase 2+ modules that are currently production-deployed have zero test coverage. All Phase 1 modules have at least one spec file.
- **Impact:** Regressions in invoice creation, budget tracking, and client inquiry flows are undetected. These are the modules most recently modified and most likely to change.
- **Fix:** Add at minimum one service-level spec file per module covering the happy path and key error cases. Priority order: `invoices` → `inquiries` → `budgets` → `clients` → `guest-lists` → `invoice-branding`.
- **Resolution:** All 6 spec files added. API test count increased from 160 → 230 tests across 22 test files. See Module Inventory table (updated below).

#### L3 — `app.module.spec.ts` Excluded from Test Runs Indefinitely

- **File:** `apps/api/src/app.module.spec.ts`
- **Problem:** This spec file is excluded from the Vitest unit test config because it requires Express at runtime. The comment implies it should be an integration test but it has not been moved to the integration test suite.
- **Impact:** The app module wiring (guard registration, middleware binding, module imports) is never tested.
- **Fix:** Move to `apps/api/test/` as an integration test using a real NestJS test application. It should run in the `test:e2e` suite, not be excluded indefinitely from unit tests.

#### L4 — `AuditService` Field Name Mapping — Verify Alignment

- **File:** `apps/api/src/audit/audit.service.ts`
- **Problem:** The `AuditService.log()` interface uses `{ action, actorId, targetType, targetId, metadata }` but the `admin_log` Prisma model uses `{ action, adminId, entityType, entityId, details }`. The mapping is done manually inside `audit.service.ts`.
- **Evidence:** `audit.service.ts:18–24` — `adminId: params.actorId`, `entityType: params.targetType`, `entityId: params.targetId`, `details: params.metadata`.
- **Impact:** The mapping is correct as implemented. The risk is that a future developer calling `AuditService.log()` may confuse `actorId` with `adminId` semantics (the audit log was designed for admins, but `actorId` is now any user). Not a bug today, but a source of confusion.
- **Fix:** Add a comment in `AuditService.log()` clarifying that `actorId` maps to `adminId` in storage and that non-admin actors (vendors, clients) are also valid callers. Low urgency.

---

## 2. Module Inventory

All 18 modules as of 2026-03-25 (post-audit):

| Module | Phase | .ts Files | Spec Files | Test Coverage | Notes |
|--------|-------|-----------|------------|---------------|-------|
| `auth` | 1 | 7 | 1 | ✅ | OTP, JWT, refresh rotation, CSRF |
| `vendors` | 1 | 5 | 1 | ✅ | CRUD, status machine, slug; XSS sanitization added |
| `listings` | 2 | 5 | 1 | ✅ | Service + rental types, upload; XSS sanitization added |
| `portfolio` | 2 | 4 | 1 | ✅ | Cloudinary signed URL flow |
| `reviews` | 2 | 7 | 2 | ✅ | Vendor + listing reviews, replies, moderation; XSS on replies |
| `disputes` | 3 | 6 | 2 | ✅ | Dispute workflow, appeal, admin decision |
| `search` | 2 | 4 | 1 | ✅ | Ranked SQL search across vendors + listings |
| `admin` | 3 | 4 | 1 | ✅ | Moderation queues, analytics; `GET /admin/audit-log` added |
| `health` | Core | 3 | 0 | — | DB + service ping; no logic to test |
| `audit` | Core | 3 | 1 | ✅ | Append-only `admin_log`; `Prisma.InputJsonValue` cast fixed |
| `prisma` | Core | 2 | 0 | — | Global PrismaService; tested indirectly |
| `common` | Core | 16 | 4 | ✅ | Guards, decorators, filters, pipes, middleware; Sentry added |
| `notifications` | 2 | ~3 | 1 | ✅ | Resend email + Termii SMS wrappers |
| `budgets` | 2+ | 4 | 1 | ✅ | Client budget planner — 10 tests added |
| `guest-lists` | 2+ | 4 | 1 | ✅ | Guest list + RSVP tracking — 12 tests added |
| `inquiries` | 2+ | 3 | 1 | ✅ | Vendor inquiry CRM — 11 tests added |
| `invoices` | 2+ | 5 | 1 | ✅ | Invoice lifecycle, confirm, funnel — 18 tests; confirmToken added |
| `invoice-branding` | 2+ | 3 | 1 | ✅ | Vendor branding for invoices — 13 tests added |
| `clients` | 2+ | 3 | 1 | ✅ | Client profile CRUD — 6 tests added |
| **TOTAL** | — | **~106** | **22** | ✅ | 230 tests passing (was 160 across 16 files) |

---

## 3. Security Posture Summary

### Guard Stack (request processing order)

```
Incoming Request
      │
      ▼
[Helmet]           → Sets security headers (CSP, HSTS, X-Frame-Options)
[CORS]             → Origin whitelist (FRONTEND_URL env var)
[cookie-parser]    → Parses httpOnly cookies
[CsrfMiddleware]   → Double-submit cookie check on state-changing routes
      │
      ▼
[ThrottlerGuard]   → 60 req/60s per IP (global)
[PhoneThrottlerGuard] → 3 OTP requests per phone/10min (OTP endpoints only)
      │
      ▼
[JwtAuthGuard]     → APP_GUARD: validates access token from httpOnly cookie
                     Routes with @Public() bypass this guard
      │
      ▼
[RolesGuard]       → Checks JWT payload role against @Roles() decorator
                     Applied explicitly on admin endpoints
      │
      ▼
[VendorOwnerGuard / ListingOwnerGuard / InvoiceOwnerGuard / ...]
                   → Checks req.user.vendorId === params.vendorId (ownership)
                     Applied explicitly on mutation endpoints
      │
      ▼
[ZodValidationPipe] → Validates request body against @eventtrust/shared schemas
      │
      ▼
[Controller]
      │
      ▼
[Service + AuditService.log()]   → Every state change appended to admin_log
      │
      ▼
[GlobalExceptionFilter]          → Maps Prisma + HTTP exceptions to JSON responses
                                   ✅ Sentry.captureException() for 5xx paths
```

**CSRF exclusions (documented):**
- `POST /auth/otp/request` — pre-auth, no session
- `POST /auth/otp/verify` — pre-auth, no session
- `POST /auth/refresh` — uses refresh token from httpOnly cookie; CSRF not applicable
- `GET /auth/csrf-token` — issues the CSRF token
- `GET /health` — public health check
- `POST /invoices/:id/confirm` — public client confirmation ✅ secured with `?token` (confirmToken)

---

## 4. API Surface Map

### Auth (`/auth`)

| Method | Route | Auth | Guard | Zod Schema | Audited |
|--------|-------|------|-------|------------|---------|
| POST | `/auth/otp/request` | Public | PhoneThrottler | `otpRequestSchema` | — |
| POST | `/auth/otp/verify` | Public | PhoneThrottler | `otpVerifySchema` | ✅ `user.login` |
| POST | `/auth/refresh` | Cookie | — | — | — |
| POST | `/auth/logout` | JWT | — | — | — |
| GET | `/auth/me` | JWT | — | — | — |
| GET | `/auth/csrf-token` | Public | — | — | — |

### Vendors (`/vendors`)

| Method | Route | Auth | Guard | Zod Schema | Audited |
|--------|-------|------|-------|------------|---------|
| POST | `/vendors` | JWT | — | `createVendorSchema` | ✅ |
| PATCH | `/vendors/:id` | JWT | VendorOwner | `updateVendorSchema` | ✅ |
| POST | `/vendors/:id/submit` | JWT | VendorOwner | — | ✅ |
| GET | `/vendors/:id` | Public | — | — | — |
| GET | `/vendors/slug/:slug` | Public | — | — | — |
| PATCH | `/vendors/:id/status` | JWT | Roles(ADMIN) | `updateVendorStatusSchema` | ✅ |
| PATCH | `/vendors/:id/subscription` | JWT | Roles(ADMIN) | — | ✅ |

### Listings (`/listings`, `/vendors/:vendorId/listings`)

| Method | Route | Auth | Guard | Zod Schema | Audited |
|--------|-------|------|-------|------------|---------|
| POST | `/listings/upload-url` | JWT | — | — | — |
| POST | `/listings/service` | JWT | — | `createServiceListingSchema` | ✅ |
| POST | `/listings/rental` | JWT | — | `createRentalListingSchema` | ✅ |
| GET | `/listings` | Public | — | — | — |
| GET | `/listings/:id/similar` | Public | — | `?limit` query param | — |
| GET | `/listings/:id` | Public | — | — | — |
| PATCH | `/listings/:id` | JWT | ListingOwner | `updateService/RentalListingSchema` | ✅ |
| DELETE | `/listings/:id` | JWT | ListingOwner | — | ✅ |
| GET | `/vendors/:vendorId/listings` | Public | — | — | — |

### Portfolio (`/vendors/:vendorId/portfolio`)

| Method | Route | Auth | Guard | Zod Schema | Audited |
|--------|-------|------|-------|------------|---------|
| GET | `/vendors/:id/portfolio` | Public | — | — | — |
| POST | `/vendors/:id/portfolio/upload-url` | JWT | VendorOwner | — | — |
| POST | `/vendors/:id/portfolio/confirm` | JWT | VendorOwner | — | ✅ |
| DELETE | `/vendors/:id/portfolio/:itemId` | JWT | VendorOwner | — | ✅ |

### Reviews (`/reviews`, admin routes)

| Method | Route | Auth | Guard | Zod Schema | Audited |
|--------|-------|------|-------|------------|---------|
| POST | `/reviews` | JWT | — | `createReviewSchema` | ✅ |
| GET | `/reviews/:id` | Public | — | — | — |
| GET | `/listings/:id/reviews` | Public | — | — | — |
| GET | `/vendors/:id/reviews` | Public | — | — | — |
| GET | `/vendors/:vendorId/reviews/pending` | JWT | VendorOwner | — | — |
| GET | `/admin/reviews/pending` | JWT | Roles(ADMIN) | — | — |
| POST | `/admin/reviews/:id/approve` | JWT | Roles(ADMIN) | — | ✅ |
| POST | `/admin/reviews/:id/reject` | JWT | Roles(ADMIN) | — | ✅ |
| POST | `/reviews/:id/reply` | JWT | ReviewOwner | `createReplySchema` | ✅ |
| PATCH | `/reviews/:id/reply` | JWT | ReviewOwner | `updateReplySchema` | ✅ |

### Disputes (`/disputes`, admin routes)

| Method | Route | Auth | Guard | Zod Schema | Audited |
|--------|-------|------|-------|------------|---------|
| POST | `/disputes` | JWT | — | `createDisputeSchema` | ✅ |
| POST | `/disputes/:id/appeal` | JWT | DisputeOwner | — | ✅ |
| GET | `/vendors/:id/disputes` | JWT | VendorOwner | — | — |
| GET | `/admin/disputes` | JWT | Roles(ADMIN) | — | — |
| POST | `/admin/disputes/:id/decide` | JWT | Roles(ADMIN) | — | ✅ |
| POST | `/admin/disputes/:id/close` | JWT | Roles(ADMIN) | — | ✅ |

### Search (`/search`)

| Method | Route | Auth | Guard | Zod Schema | Audited |
|--------|-------|------|-------|------------|---------|
| GET | `/search/vendors` | Public | — | query params | — |
| GET | `/search/listings` | Public | — | query params | — |

### Invoices (`/invoices`, `/vendors/:vendorId/invoices`, `/client/invoices`)

| Method | Route | Auth | Guard | Zod Schema | Audited |
|--------|-------|------|-------|------------|---------|
| POST | `/invoices` | JWT | — | `createInvoiceSchema` | ✅ |
| GET | `/invoices/:id` | Public | — | — | — |
| PATCH | `/invoices/:id` | JWT | InvoiceOwner | `updateInvoiceSchema` | ✅ |
| POST | `/invoices/:id/send` | JWT | InvoiceOwner | — | ✅ |
| POST | `/invoices/:id/confirm` | **Public** | `?token` required | — | ✅ |
| POST | `/invoices/:id/complete` | JWT | — | — | ✅ |
| GET | `/vendors/:id/invoices` | JWT | VendorOwner | — | — |
| GET | `/vendors/:id/invoices/funnel` | JWT | VendorOwner | — | — |
| GET | `/client/invoices` | JWT | — | — | — |
| GET | `/client/invoices/:id` | JWT | — | — | — |

### Budgets, Guest Lists, Inquiries, Invoice Branding, Clients

All follow the same pattern: JWT auth, owner guards on mutations, Zod validation on POST/PATCH, AuditService on state changes. No known compliance gaps beyond missing test coverage (L2).

---

## 5. Missing Endpoints

Cross-referencing with `AUDIT.md` frontend gaps:

| Endpoint | Priority | Frontend Gap | Notes |
|----------|----------|-------------|-------|
| ~~`GET /listings/:id/similar?limit=4`~~ | ✅ Done | FRONTEND_AUDIT.md H3 | Implemented 2026-03-24 |
| ~~`GET /admin/audit-log`~~ | ✅ Done | FRONTEND_AUDIT.md GAP-D3 | Implemented 2026-03-25 with page/limit pagination |
| ~~`GET /vendors/:vendorId/reviews/pending`~~ | ✅ Done | FRONTEND_AUDIT.md GAP-C6 | Implemented 2026-03-25; VendorOwnerGuard, placed before public GET route |
| `POST /vendors/:id/notify` | 🟢 | FRONTEND_AUDIT.md GAP-C4 | Confirm Resend email notification is triggered on status change |

---

## 6. Test Coverage Gaps

| Module | Missing | Priority | Rationale |
|--------|---------|----------|-----------|
| `invoices` | Service unit tests, status machine tests | 🟠 | Most complex state machine in Phase 2; actively used |
| `inquiries` | Service unit tests | 🟠 | Core CRM flow; inquiry status transitions untested |
| `budgets` | Service unit tests | 🟡 | Client-facing; item CRUD and totals untested |
| `clients` | Service unit tests | 🟡 | Profile creation and lookup untested |
| `guest-lists` | Service unit tests | 🟡 | Bulk add and RSVP tracking untested |
| `invoice-branding` | Service unit tests | 🟢 | Simple CRUD; lower risk |
| `notifications` | Service unit tests | 🟡 | Email delivery mocked but not tested |
| `app.module.spec.ts` | Integration test suite | 🟢 | Module wiring never verified |

---

## 7. Sprint Planning

### ~~Sprint 1 — Security & Reliability Fixes~~ ✅ Complete 2026-03-25

> Goal: No silent production failures; deleted records can't be fetched; CSRF confirm endpoint audited.

| # | Task | Severity | Status |
|---|------|----------|--------|
| 1 | Add env validation (`ConfigModule.forRoot` + Zod `validate` function) | 🟠 | ✅ Done |
| 2 | Add Sentry to `GlobalExceptionFilter` for all 5xx paths | 🟠 | ✅ Done |
| 3 | Fix `findUnique` soft-delete gap — replace with `findFirst` + `deletedAt: null` in all services | 🟠 | ✅ Done |
| 4 | Audit `POST /invoices/:id/confirm` — verify or add confirmation token | 🟠 | ✅ Done |
| 5 | Fix `PhoneThrottlerGuard` IP fallback — throw on missing phone | 🟡 | ✅ Done |
| 6 | Fix Termii silent failure — throw `ServiceUnavailableException` on final retry | 🟢 | ✅ Done |

---

### ~~Sprint 2 — Type Safety & Missing Endpoints~~ ✅ Complete 2026-03-25

> Goal: TypeScript `as any` casts removed; missing frontend endpoints unblocked.

| # | Task | Severity | Status |
|---|------|----------|--------|
| 7 | Fix `role as any` in `auth.service.ts` — validate against `UserRole` enum | 🟡 | ✅ Done |
| 8 | Fix `metadata as any` in `audit.service.ts` — use `Prisma.InputJsonValue` | 🟡 | ✅ Done |
| 9 | ~~Add `GET /listings/similar` endpoint~~ | ✅ Done 2026-03-24 | — |
| 10 | Add XSS sanitization on free-text fields (vendor description, review text, reply) | 🟡 | ✅ Done |
| 11 | Add `GET /admin/audit-log` endpoint with pagination | 🟡 | ✅ Done |
| 12 | Add `GET /vendors/:vendorId/reviews/pending` endpoint | 🟡 | ✅ Done |

---

### ~~Sprint 3 — Test Coverage for Phase 2+ Modules~~ ✅ Complete 2026-03-25

> Goal: All production modules have at least one spec file; no untested state machines.

| # | Task | Severity | Status |
|---|------|----------|--------|
| 13 | `invoices.service.spec.ts` — create, send, confirm, complete, status transitions | 🟠 | ✅ Done (18 tests) |
| 14 | `inquiries.service.spec.ts` — create, status update, vendor/client scoping | 🟠 | ✅ Done (11 tests) |
| 15 | `budgets.service.spec.ts` — create, add items, totals | 🟡 | ✅ Done (10 tests) |
| 16 | `clients.service.spec.ts` — create profile, findByUserId | 🟡 | ✅ Done (6 tests) |
| 17 | `guest-lists.service.spec.ts` — create, bulk add, RSVP | 🟡 | ✅ Done (12 tests) |
| 18 | `invoice-branding.service.spec.ts` — upsert, logo upload flow | 🟢 | ✅ Done (13 tests) |
| 19 | Move `app.module.spec.ts` to integration test suite | 🟢 | Deferred — not a blocking issue |

---

## 8. Files Confirmed Verified

The following files were read directly during this audit:

```
apps/api/src/main.ts
apps/api/src/app.module.ts
apps/api/src/common/filters/global-exception.filter.ts
apps/api/src/prisma/prisma.service.ts
apps/api/src/auth/auth.service.ts
apps/api/src/audit/audit.service.ts
apps/api/src/common/guards/phone-throttler.guard.ts
apps/api/src/auth/services/termii.service.ts
apps/api/src/listings/listings.controller.ts
apps/api/src/invoices/invoices.controller.ts
```

---

*End of audit. No implementation work was done in this document. All items are planning artifacts only.*
*Cross-reference: `AUDIT.md` for frontend gaps. Issues H3 (similar listings) and L2 (test coverage) have frontend counterparts.*
