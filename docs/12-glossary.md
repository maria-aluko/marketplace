# 12 — Glossary

> **Purpose**: Defines EventTrust domain and technical terms. Use these names consistently in code, docs, and conversations.

---

## EventTrust Domain Terms

| Term | Definition |
|------|-----------|
| **Vendor** | A business or individual who registers on EventTrust to offer services or equipment rentals. Has a unified Vendor Profile. |
| **Client** | A user who browses listings and contacts vendors via WhatsApp. The "demand side" of the marketplace. |
| **Admin** | A platform operator who approves vendor profiles, moderates reviews, and manages disputes. |
| **Vendor Profile** | A vendor's public business page at `eventtrust.com.ng/vendor/[slug]`. Contains business info, portfolio, listings, and reviews. |
| **Listing** | A specific service or rental item offered by a vendor. Has a `listingType` (SERVICE or RENTAL). |
| **Service Listing** | A listing for an event service (catering, photography, DJ, decorator, planner). Includes price per event/hour, service area. |
| **Rental Listing** | A listing for rented equipment (tents, chairs, generators, lighting). Includes quantity, pricePerDay, depositAmount, deliveryOption. |
| **ListingType** | Enum: `SERVICE` or `RENTAL`. Determines which fields are shown on the listing form and detail page. |
| **RentalCategory** | Enum for rental listings: `tent`, `chairs_tables`, `cooking_equipment`, `generator`, `lighting`, `other_rental`. |
| **DeliveryOption** | Enum for rental listings: `pickup_only`, `delivery_only`, `both`. |
| **Lead Marketplace** | EventTrust's Phase 1–2 model — no payment processing; clients contact vendors via WhatsApp and negotiate bookings externally. |
| **WhatsApp Contact Flow** | Client taps "Contact on WhatsApp" → `wa.me/+234XXXXXXXXXX` deep link opens WhatsApp with vendor's number. The primary contact channel. |
| **Subscription Tier** | Vendor plan level: `free`, `pro`, `pro_plus`. Controls listing count, photo limits, and access to business tools. Schema-ready from Phase 2; enforced in Phase 3. |
| **Deposit** | Rental-specific: the refundable amount a client must pay upfront when renting equipment. Stored in kobo. |
| **quantityAvailable** | Rental-specific: total stock of a rental item. Future inventory management tracks `quantityBooked` vs `quantityAvailable`. |
| **Vendor Status Machine** | `draft → pending → active | changes_requested | suspended`. All transitions through `VendorStatusService.transition()` with audit logging. |
| **Profile Completeness** | A score (0–100) calculated from filled vendor profile fields. Used in search ranking. |
| **Kobo** | Smallest unit of Nigerian Naira (NGN). 1 NGN = 100 kobo. All monetary amounts (prices, deposits) stored as integers in kobo. |
| **E.164** | International phone number format: `+[country code][number]`. All Nigerian numbers stored as `+234XXXXXXXXXX`. |
| **WAT** | West Africa Time — UTC+1. All user-visible timestamps displayed in WAT. |
| **OTP** | One-Time Password — 6-digit code sent via SMS to verify phone number ownership. Valid for 10 minutes. Max 5 verify attempts. |
| **NIN** | National Identification Number — Nigerian biometric ID. NIN-SIM linking means phone numbers are real-identity verified. |
| **CBN** | Central Bank of Nigeria — regulates all financial services. Reason payment processing is deferred to Phase 3. |
| **NDPR** | Nigeria Data Protection Regulation — Nigeria's primary data protection law (2019). Equivalent to GDPR. |
| **NCC** | Nigerian Communications Commission — regulates SMS sender IDs. Termii handles NCC compliance. |

---

## Technical Terms

| Term | Definition |
|------|-----------|
| **ADR** | Architecture Decision Record — captures a significant architectural decision, its context, and rationale. |
| **App Router** | Next.js routing system based on the `app/` directory. Uses React Server Components by default. |
| **Argon2** | Hash function used for OTP hashing. More resistant to GPU attacks than bcrypt. |
| **AuditService** | NestJS service that appends records to `admin_log` (append-only). Called on every state change. |
| **Edge Middleware** | Code running on Vercel's edge network before page render. Used for JWT validation and auth redirects. |
| **GlobalExceptionFilter** | NestJS filter mapping Prisma errors (P2002→409, P2025→404) and formatting all errors consistently. |
| **httpOnly Cookie** | Browser cookie inaccessible to JavaScript — prevents XSS token theft. Used for `access_token` and `refresh_token`. |
| **ISR** | Incremental Static Regeneration — Next.js pre-renders pages and re-validates on a schedule (1h for vendor profiles). |
| **JWT** | JSON Web Token — signed, self-contained token carrying `{ sub: userId, role }`. Access tokens are 15-minute JWTs. |
| **Prisma `$extends`** | Prisma client extension used for soft deletes — injects `deletedAt: null` filter automatically on User, Vendor, Review, Listing. |
| **pnpm** | Package manager with workspace support. Used for monorepo dependency management. |
| **PWA** | Progressive Web App — installable on Android home screen, works offline (vendor profiles cached by service worker). |
| **Refresh Token** | Long-lived opaque token (7 days) stored as Argon2 hash in DB. Rotated on every use (refresh token rotation). |
| **RSC** | React Server Component — renders on the server, sends no JavaScript to client. Used for vendor profiles and search pages. |
| **Service Worker** | Browser background script intercepting network requests. Caches vendor profiles for offline viewing. |
| **Signed URL** | A Cloudinary upload URL with expiring cryptographic signature. Required for secure client-side portfolio/listing uploads. |
| **SSR** | Server-Side Rendering — renders on the server per request. Used for vendor profile pages (WhatsApp og:image). |
| **Turborepo** | Monorepo build system with intelligent caching. Manages task pipelines across `apps/` and `packages/`. |
| **VendorOwnerGuard** | NestJS guard checking `req.user.vendorId === params.id`. Applied to all vendor/listing mutation endpoints. |
| **Zod** | TypeScript schema validation library. Single source of truth for all data shapes in `@eventtrust/shared`. |
| **ZodValidationPipe** | NestJS pipe validating request bodies against a Zod schema before the handler runs. |

---

## Provider Terms

| Term | Definition |
|------|-----------|
| **Cloudinary** | Cloud media service for image/video upload, transformation, and CDN delivery. Used for portfolio and listing photos. |
| **Railway** | Cloud hosting for NestJS API (`eventtrust-api` service). Persistent process, no cold starts. |
| **Resend** | Transactional email provider. Used for vendor approval and review notifications (Phase 2+). |
| **Supabase** | Managed Postgres database. Used as DB only via Prisma — never Supabase JS client in app code. |
| **Termii** | Nigerian SMS/OTP provider. Primary channel for phone verification. Sender ID: `EventTrust`. |
| **Vercel** | Frontend cloud for Next.js hosting (`eventtrust-web` project). ISR, edge middleware, preview deployments. |

---

## Naming Conventions in Code

| Concept | Naming Rule | Example |
|---------|------------|---------|
| Zod schemas | `camelCase` + `Schema` | `createRentalListingSchema` |
| Inferred types / payloads | `PascalCase` + `Payload` or `Response` | `CreateRentalListingPayload`, `ListingResponse` |
| Enums | `PascalCase` values | `ListingType.RENTAL`, `VendorStatus.ACTIVE` |
| DB columns | `camelCase` in Prisma | `pricePerDay`, `quantityAvailable`, `createdAt` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `TERMII_API_KEY`, `JWT_SECRET` |
| Next.js public env | `NEXT_PUBLIC_` prefix | `NEXT_PUBLIC_API_URL` |
| API routes | `kebab-case` | `/auth/otp/request`, `/listings/:id` |
| React components | `PascalCase` | `RentalListingForm.tsx`, `VendorCard.tsx` |
| Hooks | `useCamelCase` | `useAuth.ts`, `useListings.ts` |
| Cookie names | `snake_case` | `access_token`, `refresh_token`, `csrf_token` |
