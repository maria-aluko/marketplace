# 6 — Runtime View

> **Purpose**: Shows how EventTrust Nigeria behaves at runtime for the most critical scenarios. Focus on interactions between components, timing, and error handling.

---

## 6.1 Scenario: Phone OTP Authentication Flow

**Trigger**: User enters their phone number and taps "Get Code"

```
Client (Browser/PWA)          NestJS API                    Termii (SMS)
       │                           │                              │
       │  POST /auth/otp/request   │                              │
       │  { phone: "+2348012345678" }                             │
       │──────────────────────────►│                              │
       │                           │ 1. Normalise to E.164        │
       │                           │ 2. Check rate limit (3/10min)│
       │                           │ 3. Generate 6-digit OTP      │
       │                           │ 4. Argon2 hash OTP           │
       │                           │ 5. Store hash in DB (TTL 10m)│
       │                           │ 6. Send via Termii           │
       │                           │─────────────────────────────►│
       │                           │◄─── { messageId } ───────────│
       │  200 { message: "OTP sent" }                             │
       │◄──────────────────────────│                              │
       │                           │                              │
       │  [User reads SMS OTP]     │                              │
       │                           │                              │
       │  POST /auth/otp/verify    │                              │
       │  { phone, code: "123456" }│                              │
       │──────────────────────────►│                              │
       │                           │ 7. Fetch OTP hash from DB    │
       │                           │ 8. argon2.verify()           │
       │                           │ 9. Increment attempt counter │
       │                           │ 10. Upsert user in DB        │
       │                           │ 11. Issue JWT pair           │
       │  200 Set-Cookie:          │                              │
       │   access_token (15min)    │                              │
       │   refresh_token (7d)      │                              │
       │   csrf_token (JS-readable)│                              │
       │◄──────────────────────────│                              │
```

**Error paths:**
- Rate limit exceeded (>3 attempts/10min): `429 Too Many Requests`
- OTP expired (>10 min) or wrong code: `400 Invalid OTP` (do NOT distinguish — timing attack prevention)
- Max verify attempts (>5): OTP invalidated, must request new one
- Termii unavailable: `503 SMS service unavailable`

---

## 6.2 Scenario: Vendor Onboarding + Approval

**Trigger**: A new vendor registers and creates a profile

```
Vendor (Browser)           NestJS API               Admin (Dashboard)
       │                        │                          │
       │ POST /auth/otp/request │                          │
       │ POST /auth/otp/verify  │                          │
       │ [Authenticated]        │                          │
       │                        │                          │
       │ POST /vendors          │                          │
       │ { businessName, ... }  │                          │
       │───────────────────────►│                          │
       │                        │ Validate createVendorSchema
       │                        │ Create vendor (status: DRAFT)
       │                        │ Generate slug
       │ 201 { vendor: { id, slug, status: "draft" } }    │
       │◄───────────────────────│                          │
       │                        │                          │
       │ PATCH /vendors/:id     │                          │
       │ [Fill profile details] │                          │
       │───────────────────────►│                          │
       │                        │ VendorOwnerGuard checks  │
       │                        │ Update profile fields    │
       │ 200 { vendor }         │                          │
       │◄───────────────────────│                          │
       │                        │                          │
       │ POST /vendors/:id/submit                          │
       │───────────────────────►│                          │
       │                        │ transition(DRAFT → PENDING)
       │                        │ AuditService.log()       │
       │ 200 { status: "pending" }                         │
       │◄───────────────────────│                          │
       │                        │                          │
       │                        │     PATCH /vendors/:id/status
       │                        │◄─────────────────────────│
       │                        │ [Admin] RolesGuard(ADMIN) │
       │                        │ transition(PENDING → ACTIVE)
       │                        │ AuditService.log()       │
       │                        │─────────────────────────►│
       │                        │                          │
       │ [Vendor can now create listings]
```

---

## 6.3 Scenario: Client Search → WhatsApp Contact

**Trigger**: Client searches for vendors/listings

```
Client (Browser/PWA)          Next.js SSR               NestJS API
       │                            │                         │
       │ GET /search?q=catering     │                         │
       │    &area=Victoria+Island   │                         │
       │────────────────────────────►                         │
       │                            │ GET /search?...         │
       │                            │────────────────────────►│
       │                            │                         │ Ranked SQL query:
       │                            │                         │ listings JOIN vendors
       │                            │                         │ WHERE vendor.status='active'
       │                            │                         │ AND listing.listingType=...
       │                            │                         │ ORDER BY ranking score
       │                            │◄── { listings[] } ──────│
       │ SSR: listings page         │                         │
       │◄────────────────────────────                         │
       │                            │                         │
       │ [Client taps listing]      │                         │
       │                            │                         │
       │ GET /vendor/[slug]         │                         │
       │    (SSR with og:image)     │                         │
       │────────────────────────────►                         │
       │                            │ GET /vendors/:slug      │
       │                            │────────────────────────►│
       │                            │◄── { vendor, listings } │
       │ SSR: vendor profile page   │                         │
       │◄────────────────────────────                         │
       │                            │                         │
       │ [Client taps "Contact on WhatsApp"]
       │                            │                         │
       │ wa.me/+2348012345678       │                         │
       │ → Opens WhatsApp with vendor's number
       │ → Booking negotiated externally
```

**WhatsApp link construction:**
```typescript
// apps/web/src/lib/whatsapp.ts
export function buildWhatsAppLink(phone: string, message?: string): string {
  const normalised = phone.replace(/\D/g, '');
  const encoded = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${normalised}${encoded}`;
}
```

---

## 6.4 Scenario: Rental Listing Creation

**Trigger**: Active vendor creates a rental listing from dashboard

```
Vendor (Browser)           NestJS API                  Prisma / DB
       │                        │                            │
       │ POST /listings         │                            │
       │ {                      │                            │
       │   listingType: "RENTAL"│                            │
       │   category: "tent"     │                            │
       │   title: "...",        │                            │
       │   quantityAvailable: 10│                            │
       │   pricePerDay: 500000  │  (kobo — ₦5,000/day)      │
       │   depositAmount: 250000│                            │
       │   deliveryOption: "both"                            │
       │   condition: "..."     │                            │
       │   photos: ["public_id"]│                            │
       │ }                      │                            │
       │───────────────────────►│                            │
       │                        │ JwtAuthGuard: verify JWT   │
       │                        │ VendorOwnerGuard: check    │
       │                        │   vendor is active         │
       │                        │ ZodValidationPipe:         │
       │                        │   createRentalListingSchema│
       │                        │ ListingsService.create()   │
       │                        │────────────────────────────►
       │                        │ prisma.$transaction:       │
       │                        │  1. Create Listing         │
       │                        │  2. Create ListingRentalDetails (1:1)
       │                        │◄───────────────────────────│
       │                        │ AuditService.log()         │
       │ 201 { listing }        │                            │
       │◄───────────────────────│                            │
       │ [Listing appears in search once vendor.status = 'active']
```

**Free tier enforcement (Phase 3):**
```typescript
// ListingsService.create() checks subscription tier
const vendor = await this.prisma.vendor.findFirst({ where: { id: vendorId } });
if (vendor.subscriptionTier === 'free') {
  const count = await this.prisma.listing.count({ where: { vendorId, deletedAt: null } });
  if (count >= FREE_TIER_LISTING_LIMIT) {
    throw new ForbiddenException('Free tier limited to 1 listing. Upgrade to Pro.');
  }
}
```

---

## 6.5 Scenario: Portfolio Upload (Cloudinary Signed URL)

**Trigger**: Vendor selects an image to add to their portfolio

```
Vendor (Browser)           NestJS API                Cloudinary
       │                        │                         │
       │ GET /portfolio/sign    │                         │
       │ { folder: "portfolio" }│                         │
       │───────────────────────►│                         │
       │                        │ Verify JWT (auth check) │
       │                        │ Generate Cloudinary sig │
       │                        │ { timestamp, sig, apiKey }
       │◄───────────────────────│                         │
       │                        │                         │
       │ POST directly to       │                         │
       │ Cloudinary with sig    │                         │
       │────────────────────────────────────────────────►│
       │                        │                         │ Transform:
       │                        │                         │ f_auto, q_auto
       │                        │                         │ w_1200 (full)
       │ { public_id, url }     │                         │
       │◄────────────────────────────────────────────────│
       │                        │                         │
       │ POST /portfolio/confirm│                         │
       │ { publicId, mediaType }│                         │
       │───────────────────────►│                         │
       │                        │ Validate limits         │
       │                        │ (10 images, 2 videos)   │
       │                        │ Prisma: create          │
       │                        │   VendorPortfolio record│
       │ 201 { portfolioItem }  │                         │
       │◄───────────────────────│                         │
```

---

## 6.6 Scenario: JWT Refresh on 401

**Trigger**: API returns `401 Unauthorized` (access token expired after 15 min)

```
Client (apiClient)         NestJS API                Auth Endpoint
       │                        │                         │
       │ GET /vendors/me        │                         │
       │───────────────────────►│                         │
       │                        │ access_token expired    │
       │ 401 Unauthorized       │                         │
       │◄───────────────────────│                         │
       │                        │                         │
       │ [apiClient catches 401, skipRefreshRetry=false]  │
       │ POST /auth/refresh     │                         │
       │ (refresh_token cookie sent automatically)        │
       │────────────────────────────────────────────────►│
       │                        │                         │ Verify hash in DB
       │                        │                         │ Rotate token
       │ 200 Set-Cookie: new tokens                       │
       │◄────────────────────────────────────────────────│
       │                        │                         │
       │ Retry: GET /vendors/me │                         │
       │ [skipRefreshRetry=true]│                         │
       │───────────────────────►│                         │
       │ 200 { vendor }         │                         │
       │◄───────────────────────│                         │
```

If refresh fails → `apiClient` redirects to `/login`.

---

## 6.7 Error Handling Pattern

All API errors follow a consistent shape:

```typescript
// Standard error response (GlobalExceptionFilter)
interface ApiErrorResponse {
  statusCode: number;
  message: string;       // Human-readable, safe to show users
  code: string;          // Machine-readable: 'OTP_EXPIRED', 'RATE_LIMITED', etc.
  timestamp: string;     // ISO 8601 UTC
}
```

Prisma errors are mapped in `GlobalExceptionFilter`:
- `P2002` (unique constraint) → `409 Conflict`
- `P2025` (record not found) → `404 Not Found`
