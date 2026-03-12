# 4 — Solution Strategy

> **Purpose**: Explains *why* the chosen technologies and patterns were selected for EventTrust Nigeria. Justifies key trade-offs. Links to specific ADRs where a decision was non-trivial.

---

## 4.1 Core Strategic Decisions

### 4.1.1 Lead Marketplace Model (Not Transactional)

**Decision**: Phase 1–2 is a lead generation marketplace. No payment processing. WhatsApp is the contact channel.

**Rationale:**
- Fastest path to value for Lagos vendors — they already use WhatsApp for bookings
- Avoids CBN regulatory complexity for holding customer funds
- Reduces MVP scope to discovery + trust signals + listings
- Transaction infrastructure (escrow, deposits, commissions) introduced in Phase 3 once liquidity is established

**Contact flow:** Client finds listing → taps "Contact on WhatsApp" → `wa.me/+234XXXXXXXXXX` deep link → vendor receives WhatsApp inquiry.

→ See [03-context-scope.md](./03-context-scope.md) — Out of Scope section

---

### 4.1.2 Unified Listing Entity for Services and Rentals

**Decision**: Single `Listing` model with `listingType: SERVICE | RENTAL` under one Vendor profile. Rental-specific data isolated in `ListingRentalDetails` (1:1).

**Rationale:**
- A caterer may also rent out cooking equipment — unified vendor identity, multiple listing types
- Avoids duplicated search/review/portfolio code for two separate product models
- Rental-specific fields (quantity, pricePerDay, depositAmount, deliveryOption, condition) stay isolated without polluting the base Listing model
- One search query filters by `listingType` and `rentalCategory`

**Consequence:** Search queries always filter by `listingType`; frontend forms branch on listing type for rental-specific fields.

→ See ADR-008 in [09-architecture-decisions.md](./09-architecture-decisions.md)

---

### 4.1.3 Phone-First Authentication (Termii OTP)

**Decision**: Phone number + 6-digit OTP is the only auth method in Phase 1. JWTs in httpOnly cookies. No email, no OAuth.

**Auth flow:**
```
1. User enters +234 phone number
2. Server normalises → E.164, rate-checks (max 3/10min), sends OTP via Termii
3. OTP hashed with Argon2, stored in DB (TTL: 10 min)
4. User submits OTP → server verifies hash, tracks attempts (max 5)
5. Server issues: access_token (JWT, 15 min) + refresh_token (opaque, 7 days)
6. Both tokens in httpOnly, Secure, SameSite=Lax cookies
7. Refresh token stored hashed in DB; rotated on each use
8. CSRF token (non-httpOnly) read by JS for double-submit cookie pattern
```

**Rationale:**
- Phone numbers have near-universal penetration in Nigeria vs email
- NIN-SIM linking means Nigerian phone numbers are real-identity verified
- httpOnly cookies prevent XSS token theft
- Termii costs ~₦6/SMS vs Twilio ~₦50/SMS for Nigerian numbers

→ See ADR-004, ADR-005 in [09-architecture-decisions.md](./09-architecture-decisions.md)

---

### 4.1.4 Turborepo Monorepo

**Decision**: Single Turborepo monorepo with pnpm workspaces. `apps/api` + `apps/web` + `packages/shared` + `packages/config`.

**Rationale:**
- Type changes in `@eventtrust/shared` propagate instantly to both apps — no publish step
- Turborepo remote cache (via GitHub Actions) avoids re-running unchanged builds
- Single `pnpm install` sets up the entire project
- `turbo.json` pipelines enforce correct build order (shared → api/web)

→ See [ADR-001-monorepo.md](./ADR-001-monorepo.md)

---

### 4.1.5 Shared Zod Schemas as Single Source of Truth

**Decision**: All data shapes defined as Zod schemas in `@eventtrust/shared`. TypeScript types inferred — never handwritten. Same schema validates React form (client) and NestJS body (server).

```typescript
// packages/shared/src/validation/index.ts
export const createRentalListingSchema = z.object({
  title: z.string().min(5).max(100),
  category: rentalCategorySchema,           // RentalCategory enum
  quantityAvailable: z.number().int().min(1),
  pricePerDay: z.number().int().positive(),  // stored in kobo
  depositAmount: z.number().int().min(0),
  deliveryOption: deliveryOptionSchema,      // DeliveryOption enum
  condition: z.string().min(10).max(500),
  photos: z.array(z.string()).min(1).max(10),
});
export type CreateRentalListingPayload = z.infer<typeof createRentalListingSchema>;
```

→ See ADR-007 in [09-architecture-decisions.md](./09-architecture-decisions.md)

---

### 4.1.6 Mobile-First PWA

**Decision**: Next.js 15 App Router with PWA capabilities. 375px base viewport. Service worker for offline vendor profiles.

**Rationale:**
- ~85% of Nigerian internet users are on Android; mid-range devices (1–3 GB RAM)
- 2G/3G primary network — React Server Components reduce JS sent to client
- WhatsApp sharing is a primary discovery channel → dynamic `og:image`, `og:title`, `og:description` on every vendor/listing page (SSR renders correctly for WhatsApp preview)
- PWA install prompt on Android Chrome increases re-engagement

---

### 4.1.7 Cloudinary Signed Upload Flow

**Decision**: NestJS never handles binary files. Frontend requests signed URL from NestJS → uploads directly to Cloudinary → confirms public_id back to NestJS → NestJS stores public_id in DB.

**Why Cloudinary over S3:**
- Auto-format conversion (WebP) without Lambda@Edge setup
- `f_auto,q_auto` reduces file size 40–70% — critical for 3G users
- Built-in CDN with African PoPs (Lagos, Johannesburg)
- Responsive images via URL transforms

**Limits enforced:** Max 10 images or 2 videos per vendor portfolio. Max 10 photos per listing.

---

### 4.1.8 Supabase Postgres + Prisma ORM

**Decision**: Prisma ORM is the **only** DB access layer. No raw SQL in application code. No Supabase JS client for data queries.

**Rationale:**
- Type safety from DB schema to application layer — no manual type writing
- Migrations are version-controlled (`apps/api/prisma/migrations/`)
- Soft deletes via Prisma `$extends` extension — `deletedAt` filter injected automatically
- Pooled connection via PgBouncer (`DATABASE_URL`) for serverless; direct URL for migrations (`DIRECT_DATABASE_URL`)

---

## 4.2 What We Intentionally Deferred

| Concern | Rationale |
|---------|-----------|
| Payment processing | Requires CBN-compliant PSP integration; WhatsApp-first is faster to market |
| Social auth (Google/Facebook) | Phone-first covers >95% of Nigerian users; OAuth adds complexity |
| Equipment delivery logistics | Logistics partner integration is a separate product domain |
| Subscription billing | Tier schema ready from Phase 2; billing implementation in Phase 3 |
| Real-time features (WebSockets) | Not needed for lead marketplace model |
