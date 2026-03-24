# EventTrust Nigeria — Frontend Audit & UX Gap Analysis

> **Generated:** 2026-03-19 | **Last updated:** 2026-03-24
> **Phase:** End of Phase 1, entering Phase 2 — Sprint 1 + Sprint 2 (quick wins) + Sprint 3 (discovery) **COMPLETE**
> **Scope:** Frontend only (`apps/web/`). Backend audit is a separate document.

---

## Quick Wins (CEO View)

These are the highest-leverage fixes — small effort, outsized user impact:

| # | Fix | Why It Matters | Status |
|---|-----|----------------|--------|
| 1 | Post-login redirect | Users who auth from a listing page land on dashboard, not the listing — breaks conversion | ✅ Done |
| 2 | "View My Profile" link on vendor dashboard | Active vendors don't know their public URL exists | ✅ Done |
| 3 | Input touch target (`h-10` → `h-11`) | 40px inputs fail 44px minimum — affects every form on mobile | ✅ Done |
| 4 | Sentry in `error.tsx` | Crashes are invisible in production right now | ✅ Done |
| 5 | `dashboard/error.tsx` | Dashboard errors show generic app-level error instead of contextual message | ✅ Done |
| 6 | Footer placeholder links | `/about`, `/contact`, `/terms` all go to `#` — looks unfinished | ⏳ Sprint 4 |
| 7 | Status-aware vendor overview | A PENDING or DRAFT vendor sees no guidance on what to do next | ✅ Done |

---

## Legend & Scope

**Severity:**
- 🔴 **Critical** — broken flow, data loss risk, or security gap
- 🟠 **High** — user blocked or confused; degrades conversion
- 🟡 **Medium** — UX gap; workaround exists but experience suffers
- 🟢 **Low** — polish item; doesn't block users

**Scope:** `apps/web/` only. Backend (`apps/api/`) audit is separate.

**Confirmed missing files (as of audit date):**
- `apps/web/src/app/dashboard/error.tsx` — MISSING
- `apps/web/src/app/services/loading.tsx` — MISSING
- `apps/web/src/app/equipment/loading.tsx` — MISSING
- `apps/web/src/app/listings/[id]/page.tsx` — MISSING (listing detail route may be at a different path — confirm actual route structure)

**Note on portfolio gallery:** `apps/web/src/components/portfolio/portfolio-gallery.tsx` was not found at this path. Issues referencing it should be verified against the actual portfolio component location.

---

## 1. Codebase Audit — Compliance with CLAUDE.md

### ✅ What's Compliant

- No raw `fetch()` calls — all client components use `apiClient` (`src/lib/api-client.ts`), all server components use `serverFetch` (`src/lib/server-api.ts`)
- JWT stored in httpOnly cookies only — never localStorage
- CSRF double-submit cookie pattern correctly implemented in `api-client.ts`
- Server components by default; `use client` only for interactive elements
- All forms show loading and error states
- Zod schemas centralized in `@eventtrust/shared`
- OTP rate limiting via `PhoneThrottlerGuard`

---

### 🟠 High Priority Issues

#### ~~H1 — Post-Login Redirect Not Consumed~~ ✅ Fixed 2026-03-24
- **File:** `apps/web/src/components/auth/otp-verify-form.tsx:103–110`
- `searchParams.get('redirect')` was already read; added relative-path guard (`startsWith('/') && !startsWith('//')`) to prevent open redirect. Falls back to `/admin` (admin users) or `/dashboard`.

#### ~~H2 — No Sentry Error Reporting in Error Boundary~~ ✅ Fixed 2026-03-24
- **File:** `apps/web/src/app/error.tsx`
- Added `useEffect(() => { Sentry.captureException(error); }, [error])`. Also applied the same pattern to the new `apps/web/src/app/dashboard/error.tsx`.

#### ~~H3 — Similar Listings — Full Table Scan~~ ✅ Fixed 2026-03-24
- **Files:** `apps/web/src/app/listings/[id]/page.tsx`, `apps/api/src/listings/listings.service.ts`, `apps/api/src/listings/listings.controller.ts`
- Backend `findSimilar()` added; `GET /listings/:id/similar?limit=4` endpoint added. Frontend listing detail page now calls this endpoint instead of fetching all listings.

---

### 🟡 Medium Priority Issues

#### ~~M1 — Logo Missing `aria-label`~~ ✅ Fixed 2026-03-24
- **File:** `apps/web/src/components/layout/header.tsx:9`
- Added `aria-label="EventTrust Home"` to the logo `<Link>`.

#### M2 — Footer Placeholder Links
- **File:** `apps/web/src/components/layout/footer.tsx`
- **Problem:** About, Contact, Terms links all point to `#`. Looks unfinished and fails SEO.
- **Fix:** Create `/about`, `/contact`, `/terms` as minimal static pages, or remove the links until the pages exist. Placeholder `#` hrefs are worse than nothing.

#### ~~M3 — No Suspense Skeleton on `/services` and `/equipment`~~ ✅ Fixed 2026-03-24
- Created `apps/web/src/app/services/loading.tsx` and `apps/web/src/app/equipment/loading.tsx` with skeleton cards matching `ListingSearchCard` dimensions (image block + badge row + title + vendor strip).

#### ~~M4 — Input Touch Target Too Small~~ ✅ Fixed 2026-03-24
- **File:** `apps/web/src/components/ui/input.tsx:10`
- Changed `h-10` → `h-11` (40px → 44px). Affects every form in the app.

#### M5 — `StarRating` Interactive Mode Touch Target
- **File:** `apps/web/src/components/ui/star-rating.tsx`
- **Problem:** Star buttons at `xs` and `sm` sizes in interactive mode may fall below 44px.
- **Fix:** Add `min-h-[44px] min-w-[44px]` to the star button wrapper when `interactive=true`.

#### M6 — `vendor-dashboard.tsx` Imports Page Component Directly
- **File:** `apps/web/src/components/dashboard/vendor-dashboard.tsx` (219 lines)
- **Problem:** Imports `ListingsPage` from a pages directory inside a component file — breaks component isolation and makes the component harder to test.
- **Fix:** Route to `/dashboard/listings` via navigation instead of embedding the page component.

---

### 🟢 Low Priority / Polish

#### L1 — Video Play Button Missing `aria-label`
- **File:** Portfolio gallery component (confirm actual path — see note above)
- **Problem:** Icon-only overlay play button has no `aria-label="Play video"`.
- **Fix:** Add `aria-label="Play video"` to the button.

#### L2 — Admin Layout Shows Generic "Loading..." During Auth Check
- **File:** `apps/web/src/app/admin/layout.tsx`
- **Problem:** During the auth check, a generic "Loading..." string is shown. Inconsistent with the skeleton/spinner patterns used elsewhere.
- **Fix:** Replace with a full-page spinner or skeleton matching the admin dashboard layout.

#### L3 — `bookings-manager.tsx` Is 460 Lines
- **File:** `apps/web/src/components/dashboard/bookings-manager.tsx`
- **Suggestion:** Extract `VendorDealCard` as a standalone sub-component. No functional change needed — purely a readability improvement.

#### L4 — `invoice-generator.tsx` Is 374 Lines
- **File:** `apps/web/src/components/dashboard/invoice-generator.tsx`
- **Suggestion:** Extract each step (Details, Line Items, Preview) as sub-components. No functional change.

#### ~~L5 — No `dashboard/error.tsx`~~ ✅ Fixed 2026-03-24
- Created `apps/web/src/app/dashboard/error.tsx` with message "Dashboard error — your data could not be loaded. Try refreshing the page." Includes `Sentry.captureException`.

---

## 2. Codebase Audit — Compliance with UIUX.md

### ✅ Implemented Per UIUX.md

- Listing-centric discovery with dual-path CTAs (services / equipment)
- `ListingSearchCard` with embedded vendor summary
- Vendor profile: cover image hero, sticky WhatsApp CTA, portfolio lightbox
- 4-step vendor signup wizard with localStorage draft persistence
- OTP flow: fixed `+234` prefix, auto-focus, paste support, Web OTP API, resend timer
- Skeleton loading on vendor profile and listing detail pages
- Mobile-first CSS (375px baseline, single-column layouts)

---

### 🟠 Not Yet Implemented (from UIUX.md)

#### ~~U1 — Dashboard Overview Is Not Status-Aware~~ ✅ Fixed 2026-03-24
- **File:** `apps/web/src/components/dashboard/vendor-dashboard.tsx`
- `VendorHomeOverview` now branches on `vendor.status`:
  - `DRAFT`: progress bar + `ProfileCompletenessChecklist` (description, WhatsApp, cover image, price range) + "Complete Profile →" button
  - `PENDING`: blue info card ("under review, 1–3 business days")
  - `ACTIVE`: `VendorQuickStats` (avg rating, reviews, profile score) + "View My Profile →" link
  - `CHANGES_REQUESTED`: orange card with link to Profile tab
  - `SUSPENDED`: red card with support email

#### ~~U2 — Quick Stats Cards Missing for ACTIVE Vendors~~ ✅ Fixed 2026-03-24
- `VendorQuickStats` component added inline in `vendor-dashboard.tsx`. Shows avg rating, review count, and profile completion score from `VendorResponse`.

#### ~~U3 — "View Public Profile" Link Missing from Dashboard~~ ✅ Fixed 2026-03-24
- "View My Profile →" link added for ACTIVE vendors, linking to `/vendors/{slug}`.

#### U4 — PWA Manifest + Service Worker — Not Implemented
- **Problem:** No `public/manifest.json`, no service worker. The target demographic is 85% Android users. PWA installability is a UIUX.md requirement.
- **Impact:** Users cannot "Add to Home Screen"; no offline fallback; no push notification infrastructure.
- **Fix:** Add `public/manifest.json` with app name, icons, theme color, display mode. Add a minimal service worker (cache-first for static assets, network-first for API calls).

#### ~~U5 — Dynamic OG Images Partially Implemented~~ ✅ Fixed 2026-03-24
- **Files:** `apps/web/src/app/vendors/[slug]/opengraph-image.tsx` (created), `apps/web/src/app/listings/[id]/opengraph-image.tsx` (created)
- Next.js App Router file-based OG images using `ImageResponse` from `next/og`. Vendor image shows business name, category, area, star rating. Listing image shows title, type badge, price, vendor name. Both include EventTrust Nigeria branding.
- Removed manual `images` from `generateMetadata()` in vendor page — file-based image takes precedence.

#### U6 — Footer Links Placeholder (also flagged in CLAUDE.md section above)
- See M2 above.

---

## 3. UX Journey Maps — All User Types

### User Type A: Anonymous Visitor

**Goal:** Discover vendors or equipment for an event in Lagos.

```
/ (Homepage)
 ├─ [Find Services] ──→ /services (type=service listings search)
 │    └─ Filter: category, area, price
 │         └─ Click ListingSearchCard ──→ /listings/[id] (listing detail)
 │              ├─ View photos, price, description
 │              ├─ [Contact Vendor] ──→ INCONSISTENT (see GAP-A1 below)
 │              └─ [View Vendor Profile] ──→ /vendors/[slug]
 │                   ├─ Full profile: listings, portfolio, reviews
 │                   ├─ [Enquire on WhatsApp] ──→ GATE: requires login
 │                   └─ [Write a Review] ──→ GATE: requires login
 │                        └─ After login ──→ /dashboard (GAP-A2: not /reviews/new)
 │
 └─ [Rent Equipment] ──→ /equipment (type=rental listings search)
      └─ Same flow as services above
```

**Gaps:**

| ID | Severity | Description |
|----|----------|-------------|
| GAP-A1 | 🟠 | WhatsApp CTA is inconsistent: `EnquiryButton` on vendor profile requires login; direct WhatsApp link on listing detail does not. **Decision needed:** should all contact attempts require login for tracking? |
| GAP-A2 | ✅ | After login redirect, user lands on `/dashboard` instead of original page — **Fixed** (H1) |
| GAP-A3 | 🟡 | No "Save" / shortlist feature — anonymous users can't bookmark vendors for comparison |
| GAP-A4 | ✅ | `ShareButton` now added to `ListingSearchCard` — **Fixed** |

---

### User Type B: Client (Authenticated Renter)

**Goal:** Hire a vendor, track conversations, pay invoices, leave reviews.

```
/login
 └─ OTP request → OTP verify ──→ /dashboard

/dashboard → ClientDashboard
 ├─ Overview Tab
 │    └─ Greeting + links to browse (no booking summary)
 ├─ Bookings Tab → BookingsManager
 │    └─ Inquiry funnel: New → Contacted → Quoted → Booked → Completed → Cancelled
 │         ├─ Deal cards: WhatsApp contact, invoice links
 │         └─ /invoices/[id]
 │              ├─ [Confirm Receipt] → marks invoice paid
 │              └─ [Leave Review] → /reviews/new/[vendorId]?invoiceId=X
 └─ Budget Tab → BudgetManager
      └─ Budget planner: categories, amounts, vendor assignments
```

**Gaps:**

| ID | Severity | Description |
|----|----------|-------------|
| GAP-B1 | 🟠 | No in-app notification when vendor accepts inquiry or sends invoice |
| GAP-B2 | 🟠 | Overview tab shows no booking summary — client must navigate to Bookings tab to check status |
| GAP-B3 | 🟡 | No cancel/reject flow for client — deals can only move forward, not be cancelled |
| GAP-B4 | 🟡 | No way for client to dispute a review once submitted (disputes are vendor-side only) |
| GAP-B5 | 🟡 | Review nudge after confirmed invoice — confirm the redirect to `/reviews/new/[vendorId]` is working correctly end-to-end |
| GAP-B6 | 🟢 | No "Favourite" / saved vendors list |
| GAP-B7 | 🟢 | Budget categories not pre-populated from inquiry/booking data |

---

### User Type C: Vendor (Event Service Provider)

**Goal:** Build a profile, list services, receive inquiries, send invoices, respond to reviews.

**Onboarding Flow:**
```
/vendor/signup (4-step wizard)
 ├─ Step 1: Business Name + Category
 ├─ Step 2: Description + Areas + Price Range
 ├─ Step 3: WhatsApp Number + Website (optional)
 └─ Step 4: Review & Submit
      └─ POST /vendors → status = DRAFT
           └─ [Submit for Review] → status = PENDING
                └─ Admin reviews
                     ├─ Approve → status = ACTIVE
                     │    └─ Email notification (Resend)
                     └─ Request Changes → status = CHANGES_REQUESTED
                          └─ Email notification (Resend)
```

**Active Vendor Dashboard:**
```
/dashboard → VendorDashboard
 ├─ Overview Tab (currently generic — see U1)
 ├─ Listings Tab
 │    ├─ /dashboard/listings → list all listings
 │    ├─ /dashboard/listings/new/service → ServiceListingForm
 │    ├─ /dashboard/listings/new/rental → RentalListingForm
 │    └─ /dashboard/listings/[id] → Edit listing
 ├─ Portfolio Tab → PortfolioManager + PortfolioUploader
 ├─ Reviews Tab → ReviewsManager (list, reply within 48h, edit reply)
 ├─ Profile Tab → ProfileEditForm (edit fields, resubmit if changes_requested)
 └─ Bookings Tab → BookingsManager (vendor perspective)
      └─ InvoiceGenerator (3-step: details → line items → preview)
```

**Gaps:**

| ID | Severity | Description |
|----|----------|-------------|
| GAP-C1 | ✅ | "View My Profile" link added to ACTIVE vendor dashboard overview — **Fixed** |
| GAP-C2 | ✅ | All 5 vendor statuses now show distinct content on overview — **Fixed** |
| GAP-C3 | ✅ | `ProfileCompletenessChecklist` added to DRAFT overview showing exactly what to fill in — **Fixed** |
| GAP-C4 | 🟠 | Admin → vendor status change notification via Resend email — confirm this is built and tested end-to-end |
| GAP-C5 | 🟡 | No "Boost Listing" or subscription upgrade CTA (Phase 3, but placeholder could exist now) |
| GAP-C6 | 🟡 | Vendor cannot see their own pending/unapproved reviews — only approved reviews shown |
| GAP-C7 | 🟡 | No delete account / offboarding flow |
| GAP-C8 | 🟡 | Listing edit page exists at `/dashboard/listings/[id]` but no link to it from listing detail — vendor must navigate manually |
| GAP-C9 | 🟢 | No "Duplicate listing" to quickly create a similar service |

---

### User Type D: Admin

**Goal:** Verify vendors, moderate reviews, manage disputes.

```
/login ──→ /admin (redirected from /dashboard when role=ADMIN)

/admin → AdminDashboard
 ├─ Pending vendors queue: Approve | Request Changes | Suspend
 ├─ Reviews moderation queue: Approve | Reject
 ├─ Disputes queue: Open → Decide → Close
 └─ Analytics overview
```

**Gaps:**

| ID | Severity | Description |
|----|----------|-------------|
| GAP-D1 | 🟠 | `/admin` is not in `middleware.ts` matcher — admin layout does a client-side auth check only. If the check fails, the admin panel could flash before redirect |
| GAP-D2 | 🟡 | No bulk action support — approving vendors requires one-at-a-time |
| GAP-D3 | 🟡 | Audit log exists in DB (`admin_log`) but no UI to view it in the admin panel |
| GAP-D4 | 🟡 | No search/filter in vendor approval queue |
| GAP-D5 | 🟢 | No "impersonate user" for support investigations |

---

## 4. Missing Routes & Navigation Dead Ends

| Gap | Severity | Description | Affected File |
|-----|----------|-------------|---------------|
| Post-login redirect | ✅ Fixed | Open-redirect guard added, `?redirect=` consumed | `components/auth/otp-verify-form.tsx` |
| Vendor public profile link | ✅ Fixed | "View My Profile →" added for ACTIVE vendors | `components/dashboard/vendor-dashboard.tsx` |
| Admin in middleware | 🟠 | `/admin` not in `middleware.ts` matcher — flash risk | `middleware.ts` |
| Similar listings endpoint | ✅ Fixed | `GET /listings/:id/similar` added; frontend updated | `listings.controller.ts`, `listings/[id]/page.tsx` |
| `/about`, `/contact`, `/terms` | 🟡 | Footer links point to `#` — pages don't exist | `components/layout/footer.tsx` |
| Vendor edit listing link | 🟡 | No link from listing detail to edit — must navigate via dashboard | Listing detail page |
| Dashboard error boundary | ✅ Fixed | `app/dashboard/error.tsx` created with Sentry | — |
| Services/equipment loading | ✅ Fixed | `loading.tsx` created for both routes | — |
| Listing share button in search | ✅ Fixed | `ShareButton` added to `ListingSearchCard` | `ListingSearchCard` |
| Review nudge redirect | 🟡 | Confirm `/reviews/new/[vendorId]?invoiceId=X` redirect works after invoice confirmed | `bookings-manager.tsx` |
| Not-found page | 🟢 | `not-found.tsx` exists but has no localized copy or helpful search suggestion | `app/not-found.tsx` |

---

## 5. Missing Components for Complete User Stories

| Component | Needed For | Status |
|-----------|-----------|--------|
| `DashboardOverviewVendor` (status-aware) | Vendor sees profile status + checklist + quick stats at a glance | ✅ Done — inline in `vendor-dashboard.tsx` |
| `VendorQuickStats` (4 stat cards) | Active vendor: reviews / avg rating / profile score | ✅ Done — inline in `vendor-dashboard.tsx` |
| `ProfileCompletenessChecklist` | DRAFT vendor knows exactly what to fill in | ✅ Done — inline in `vendor-dashboard.tsx` |
| `PendingReviewBanner` | PENDING vendor sees clear status with expected timeline | ✅ Done — inline in `vendor-dashboard.tsx` |
| `SuspendedVendorBanner` | SUSPENDED vendor sees reason + support contact | ✅ Done — inline in `vendor-dashboard.tsx` |
| PWA `manifest.json` + service worker | Installable PWA for Android (primary demographic) | ⏳ Sprint 4 |
| `apps/web/src/app/dashboard/error.tsx` | Route-specific error for dashboard | ✅ Done |
| `apps/web/src/app/services/loading.tsx` | Skeleton loading for services search | ✅ Done |
| `apps/web/src/app/equipment/loading.tsx` | Skeleton loading for equipment search | ✅ Done |
| `ShareButton` on `ListingSearchCard` | Share listing directly from search results | ✅ Done |
| `opengraph-image.tsx` for vendor + listing pages | Dynamic OG images for WhatsApp sharing | ✅ Done |
| Static pages: `/about`, `/contact`, `/terms` | Footer navigation links | ⏳ Sprint 4 |
| `SaveVendorButton` | Favourite/shortlist a vendor for comparison | ⏳ Backlog |

---

## 6. Simplification & Optimization Opportunities

| Item | File | Lines | Suggestion |
|------|------|-------|------------|
| `bookings-manager.tsx` | `components/dashboard/bookings-manager.tsx` | 460 | Extract `VendorDealCard` as standalone sub-component |
| `invoice-generator.tsx` | `components/dashboard/invoice-generator.tsx` | 374 | Extract step sub-components: `InvoiceDetailsStep`, `LineItemsStep`, `PreviewStep` |
| `vendor-dashboard.tsx` | `components/dashboard/vendor-dashboard.tsx` | 219 | Remove direct page component import; navigate via router |
| Similar listings | Listing detail page | — | Replace full listings fetch with `/listings/similar?listingId=X&limit=4` |
| Admin layout auth | `app/admin/layout.tsx` | — | Add `/admin` to `middleware.ts` matcher to prevent flash |
| Input touch target | `components/ui/input.tsx` | — | `h-10` → `h-11` (40px → 44px) |
| Sentry in error boundary | `app/error.tsx` | — | `Sentry.captureException(error)` in `useEffect` |

---

## 7. Constraints Compliance Check (from UIUX.md)

| Constraint | Status | Action |
|-----------|--------|--------|
| 85% Android, 1–3GB RAM | 🟡 Partial | Split large components (bookings-manager, invoice-generator); lazy-load dashboard tabs |
| ≤200KB JS per route | 🟡 Unknown | Run `pnpm turbo run build` and review Next.js bundle analysis output |
| 375px baseline | ✅ Good | Mobile-first Tailwind throughout |
| 44px touch targets | 🟡 Partial | `Input` fixed to 44px ✅; `StarRating` interactive mode still unresolved (M5) |
| WhatsApp as primary channel | ✅ Good | Dynamic OG images implemented ✅; share button on search cards ✅ |
| Interrupted sessions | 🟡 Partial | Vendor signup auto-saves to localStorage; review form and listing forms do not |
| No payments Phase 1-2 | ✅ Good | No checkout complexity added |

---

## 8. Sprint Planning

### ~~Sprint 1 — Critical Path for Vendor Onboarding Quality~~ ✅ Complete 2026-03-24

| # | Task | Status |
|---|------|--------|
| 1 | Fix post-login redirect (open-redirect guard on `?redirect=`) | ✅ |
| 2 | Status-aware Dashboard Overview (all 5 statuses) | ✅ |
| 3 | "View My Profile" link on dashboard overview | ✅ |
| 4 | `ProfileCompletenessChecklist` on DRAFT overview | ✅ |
| 5 | Status banners (PENDING, CHANGES_REQUESTED, SUSPENDED) | ✅ |
| 6 | `VendorQuickStats` stat cards for ACTIVE overview | ✅ |
| 7 | `apps/web/src/app/dashboard/error.tsx` | ✅ |
| 8 | `apps/web/src/app/services/loading.tsx` + `equipment/loading.tsx` | ✅ |

---

### ~~Sprint 2 — Polish, Accessibility & PWA~~ ✅ Partially Complete 2026-03-24

| # | Task | Status |
|---|------|--------|
| 9 | Input touch target: `h-10` → `h-11` | ✅ |
| 10 | `StarRating` interactive mode min touch target | ⏳ |
| 11 | Sentry in `error.tsx` | ✅ |
| 12 | Logo `aria-label` in `header.tsx` | ✅ |
| 13 | Footer real pages (`/about`, `/contact`, `/terms`) or remove links | ⏳ Sprint 4 |
| 14 | Add `/admin` to `middleware.ts` matcher | ⏳ |
| 15 | `public/manifest.json` + minimal service worker | ⏳ Sprint 4 |
| 16 | Fix `vendor-dashboard.tsx` direct page import | ⏳ |

---

### ~~Sprint 3 — Discovery & Sharing~~ ✅ Complete 2026-03-24

| # | Task | Status |
|---|------|--------|
| 17 | Dynamic OG images for vendor profiles (`opengraph-image.tsx`) | ✅ |
| 18 | Dynamic OG images for listing detail (`opengraph-image.tsx`) | ✅ |
| 19 | `ShareButton` on `ListingSearchCard` | ✅ |
| 20 | Backend `GET /listings/:id/similar` + wire up frontend | ✅ |
| 21 | Confirm review nudge redirect works end-to-end after invoice confirm | ⏳ |
| 22 | Decide WhatsApp CTA consistency (login required or not) — team decision | ⏳ |

---

### Sprint 4 — Refactor & Debt

> Goal: Large files split; codebase easier to maintain.

| # | Task | Severity | Est. |
|---|------|----------|------|
| 23 | Extract `VendorDealCard` from `bookings-manager.tsx` | 🟢 | 2h |
| 24 | Extract step sub-components from `invoice-generator.tsx` | 🟢 | 2h |
| 25 | Bundle analysis — check ≤200KB JS per route | 🟡 | 1h |
| 26 | Add bulk approve to admin panel | 🟡 | 3h |
| 27 | Audit log viewer in admin panel | 🟡 | 3h |

**Sprint 4 total estimate: ~11h**

---

## 9. Files Confirmed Verified

The following files were confirmed to exist as of 2026-03-19:

```
apps/web/src/app/error.tsx
apps/web/src/app/login/page.tsx
apps/web/src/app/services/page.tsx
apps/web/src/app/equipment/page.tsx
apps/web/src/app/admin/layout.tsx
apps/web/src/middleware.ts
apps/web/src/hooks/use-auth.ts
apps/web/src/components/layout/header.tsx
apps/web/src/components/layout/footer.tsx
apps/web/src/components/ui/input.tsx
apps/web/src/components/ui/star-rating.tsx
apps/web/src/components/dashboard/vendor-dashboard.tsx  (219 lines)
apps/web/src/components/dashboard/bookings-manager.tsx  (460 lines)
apps/web/src/components/dashboard/invoice-generator.tsx (374 lines)
apps/web/src/lib/api-client.ts
apps/web/src/lib/server-api.ts
```

The following were previously **missing** and have since been **created**:

```
apps/web/src/app/dashboard/error.tsx            — ✅ Created 2026-03-24
apps/web/src/app/services/loading.tsx           — ✅ Created 2026-03-24
apps/web/src/app/equipment/loading.tsx          — ✅ Created 2026-03-24
apps/web/src/app/vendors/[slug]/opengraph-image.tsx  — ✅ Created 2026-03-24
apps/web/src/app/listings/[id]/opengraph-image.tsx   — ✅ Created 2026-03-24
```

Still unresolved:

```
apps/web/src/components/portfolio/portfolio-gallery.tsx  — MISSING (confirm actual path)
```

---

*End of audit. Sprints 1, 2 (partial), and 3 implemented as of 2026-03-24.*
