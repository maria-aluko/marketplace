# 9 — Architecture Decisions

> **Purpose**: Records important architecture decisions for EventTrust Nigeria. Uses the ADR (Architecture Decision Record) format.
>
> **When to write an ADR**: When a decision is hard to reverse, expensive, or when the rationale would be unclear to a new team member reading the code.

---

## ADR Index

| ID | Decision | Status | Date |
|----|---------|--------|------|
| [ADR-001](./ADR-001-monorepo.md) | Turborepo monorepo over separate repos | Accepted | Phase 0 |
| ADR-002 | Next.js 15 App Router (PWA, SSR-first) | Accepted | Phase 0 |
| ADR-003 | NestJS 11 as dedicated backend | Accepted | Phase 0 |
| ADR-004 | Phone OTP + JWT httpOnly cookies | Accepted | Phase 0 |
| ADR-005 | Termii over Twilio for SMS | Accepted | Phase 0 |
| ADR-006 | Prisma as sole DB access layer | Accepted | Phase 0 |
| ADR-007 | Zod shared schemas as type contract | Accepted | Phase 0 |
| ADR-008 | Unified Listing entity for services and rentals | Accepted | Phase 2 |

---

## ADR-001: Turborepo Monorepo

**Status**: Accepted

### Context
EventTrust has a NestJS API, a Next.js frontend, and shared types/schemas used in both. Without a monorepo, shared types must be published as npm packages — adding release overhead to a small team.

### Decision
**Turborepo + pnpm workspaces** monorepo. See [ADR-001-monorepo.md](./ADR-001-monorepo.md) for full details.

---

## ADR-002: Next.js 15 App Router

**Status**: Accepted

### Context
EventTrust is a mobile-first PWA targeting Nigerian users on 3G. SEO matters for vendor discovery. WhatsApp sharing requires correct SSR og:image rendering.

### Decision
**Next.js 15 with App Router exclusively.** No Pages Router. Rendering strategy: SSR for vendor profiles (og:image for WhatsApp), PWA client-side navigation for dashboard and search.

### Rationale
- React Server Components reduce JavaScript sent to client — critical for 3G users
- SSR vendor profiles render `og:image`, `og:title`, `og:description` correctly for WhatsApp sharing (a primary discovery channel)
- App Router file-based layouts simplify route-level auth guards via `middleware.ts`
- ISR for vendor profile pages reduces DB load at scale (1h revalidation)

---

## ADR-003: NestJS 11 as Dedicated Backend

**Status**: Accepted

### Context
EventTrust requires: multi-role access control (CLIENT/VENDOR/ADMIN), complex guard logic (JwtAuthGuard, RolesGuard, VendorOwnerGuard), a status machine with audit logging, and a separate API consumed by Next.js.

### Decision
Dedicated `apps/api` (NestJS 11) for all business logic. Next.js never accesses the database directly.

### Rationale
- Guard/pipe/filter system maps directly to EventTrust access control requirements
- Business logic (status machine, audit trail, OTP hashing) belongs server-side
- Separation enables future mobile app to consume the same API

---

## ADR-004: Phone OTP + JWT httpOnly Cookies

**Status**: Accepted

### Context
Nigerian users are mobile-first. Many do not have reliable email. Phone numbers are verified identities (NIN-SIM linking). Auth must be frictionless on low-end Android.

### Decision
**Phone number + 6-digit OTP** as sole auth method (Phase 1). JWTs in **httpOnly, Secure, SameSite=Lax cookies**. CSRF double-submit cookie pattern for mutation protection.

Cookie names: `access_token` (15 min JWT), `refresh_token` (7d opaque), `csrf_token` (non-httpOnly, JS-readable).

### Rationale
- Phone numbers have near-universal Nigerian penetration vs email
- httpOnly cookies prevent XSS token theft
- Argon2 OTP hashing prevents hash cracking even if DB is compromised
- Refresh token rotation with family-based revocation limits blast radius

### Alternatives Considered
| Option | Why Rejected |
|--------|-------------|
| Email/password | Low email adoption; password reset adds friction |
| OAuth (Google/Facebook) | Requires Google account; may not work on restricted data plans; Phase 3+ |
| localStorage JWT | Vulnerable to XSS |

---

## ADR-005: Termii over Twilio

**Status**: Accepted

### Decision
Use **Termii** as the default SMS/OTP provider for Nigerian numbers.

### Rationale
- Nigerian provider with local infrastructure — better delivery rates to MTN/Airtel/Glo
- Cost: Termii ~₦6/SMS vs Twilio ~₦50+/SMS (~8× cheaper)
- Pre-approved sender ID (`EventTrust`) compliant with NCC regulations

### Review Trigger
Revisit if Termii delivery rates drop below 97%. Africa's Talking is the designated fallback.

---

## ADR-006: Prisma as Sole DB Access Layer

**Status**: Accepted

### Decision
All database queries use **Prisma ORM exclusively**. No Supabase JS client for data queries. `$queryRaw` forbidden in application code.

### Rationale
- Type safety from DB schema to application layer
- Migrations version-controlled in `apps/api/prisma/migrations/`
- Soft deletes via `$extends` extension — `deletedAt` filter injected automatically on User, Vendor, Review, Listing

---

## ADR-007: Zod Shared Schemas as Type Contract

**Status**: Accepted

### Decision
All shared types are **inferred from Zod schemas** in `@eventtrust/shared`. TypeScript interfaces for shared data shapes are never written manually.

### Rationale
- Single source of truth eliminates FE/BE type drift
- Runtime validation + static types from one definition
- Breaking changes to shared schemas caught at compile time across the monorepo

---

## ADR-008: Unified Listing Entity for Services and Rentals

**Status**: Accepted
**Date**: Phase 2

### Context
`planv2.md` expands EventTrust beyond a service directory to include equipment rentals (tents, chairs, generators, lighting). A vendor can offer both services and rentals under one profile. Two separate product models (ServiceListing, RentalListing) would duplicate search, review, and portfolio code.

### Decision
Single **`Listing`** model with `listingType: SERVICE | RENTAL` under a Vendor profile. Rental-specific fields isolated in **`ListingRentalDetails`** (1:1 with Listing).

```typescript
// Listing model (Prisma)
// listingType: ListingType (SERVICE | RENTAL)
// vendorId: FK to Vendor
// listingRentalDetails?: ListingRentalDetails

// ListingRentalDetails model (1:1)
// quantityAvailable, pricePerDay, depositAmount
// deliveryOption: DeliveryOption (pickup_only | delivery_only | both)
// condition: String
```

### Rationale
- Vendor profile stays unified — one business, multiple listing types
- Search queries filter by `listingType` and `rentalCategory` on the same table
- Reviews apply to both listing types without separate review tables
- Rental-specific data stays isolated without polluting the base Listing model

### Alternatives Considered
| Option | Why Rejected |
|--------|-------------|
| Separate ServiceListing + RentalListing models | Duplicated search/review/portfolio code; unified vendor profile harder to build |
| Single table with all fields nullable | Too much null pollution; confusing schema |
| EAV (entity-attribute-value) | Loses type safety; over-engineered for two listing types |

### Consequences

**Positive:**
- One search endpoint, one review system, one portfolio system for both listing types
- Rental-specific fields typed via `ListingRentalDetails` relation — never null on service listings
- Easy to add a third listing type in future (e.g., PACKAGE) without schema restructuring

**Negative / Trade-offs:**
- Search queries must always include `listingType` filter to avoid mixing types in unexpected views
- Frontend forms must branch on `listingType` to show/hide rental-specific fields
