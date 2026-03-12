# 3 — Context & Scope

> **Purpose**: Draws a clear boundary around EventTrust Nigeria. Shows external actors, third-party services, and what the system does NOT own.

---

## 3.1 System Name

**EventTrust Nigeria** — a verified event vendor marketplace for services and equipment rentals in Lagos. Vendors create service listings (catering, photography, DJs, decorators) and rental listings (tents, chairs, generators, lighting). Clients find vendors, view listings, and contact them via WhatsApp.

---

## 3.2 Business Context

```
                        ┌──────────────────────────────────────────────────────────┐
                        │                  EventTrust Nigeria                      │
                        │                                                          │
  [Client]              │  ┌─────────────┐        ┌──────────────────┐            │
  Browses listings  ───►│  │  Next.js 15 │◄──────►│   NestJS API     │            │
  Contacts via WA        │  │  (Web/PWA)  │  HTTP  │   (apps/api)     │            │
                        │  └─────────────┘        └────────┬─────────┘            │
  [Vendor]              │                                   │ Prisma               │
  Creates profile    ──►│                          ┌────────▼─────────┐            │
  Creates listings       │                          │  Supabase Postgres│           │
  Gets leads via WA      │                          └──────────────────┘            │
                        │                                                          │
  [Admin]               │                                                          │
  Approves vendors   ───►│                                                          │
  Moderates reviews      │                                                          │
                        └───────────┬───────────────┬───────────────┬─────────────┘
                                    │               │               │
                           ┌────────▼──────┐  ┌────▼──────┐  ┌────▼────────────┐
                           │  Cloudinary   │  │  Termii   │  │  Resend (email) │
                           │  (media CDN)  │  │  (OTP SMS)│  │  (notifications)│
                           └───────────────┘  └───────────┘  └─────────────────┘
                                    │               │
                           ┌────────▼──────┐  ┌────▼──────────────────┐
                           │  WhatsApp     │  │   Vercel + Railway    │
                           │  (contact     │  │   (hosting)           │
                           │   channel)    │  └───────────────────────┘
                           └───────────────┘
```

---

## 3.3 External Actors

| Actor | Role | Integration |
|-------|------|-------------|
| **Client** | Browses listings, contacts vendors via WhatsApp | Uses EventTrust web/PWA |
| **Vendor** | Creates profile, adds service/rental listings, receives leads | Uses EventTrust dashboard |
| **Admin** | Approves vendor profiles, moderates reviews, manages disputes | Uses admin dashboard (Phase 3) |
| **WhatsApp** | Primary contact channel between client and vendor | `wa.me/+234XXXXXXXXXX` deep link, not an API integration |
| **Cloudinary** | Media CDN — vendor portfolio photos, listing images | Signed URL upload; frontend → Cloudinary direct, confirms to API |
| **Termii** | OTP SMS delivery to Nigerian numbers (+234) | `POST https://api.ng.termii.com/api/sms/otp/send` |
| **Supabase** | Managed Postgres database | Via Prisma only — never Supabase JS client in app code |
| **Vercel** | Next.js frontend hosting, edge middleware | Auto-deploy on `main` push |
| **Railway** | NestJS API hosting | Auto-deploy on `main` push; persistent process |
| **Resend** | Transactional email (vendor approval, review notifications) | Phase 2+ only |

---

## 3.4 In Scope

| Feature | Phase |
|---------|-------|
| Vendor onboarding (phone OTP, profile creation, admin approval) | Phase 1 |
| Service listings (catering, photography, DJs, decorators, planners) | Phase 2 |
| Rental listings (tents, chairs, cooking equipment, generators, lighting) | Phase 2 |
| Portfolio upload (Cloudinary signed URL flow) | Phase 2 |
| Client reviews + vendor replies | Phase 2 |
| Search + discovery (ranked SQL, filter by listingType, category, area) | Phase 2 |
| WhatsApp contact flow (wa.me deep link from listing/vendor page) | Phase 2 |
| Dispute workflow (vendor raises, admin decides, one appeal) | Phase 3 |
| Vendor business tools (CRM, booking calendar, inventory, invoicing) | Phase 3 |
| Subscription tier enforcement (free/pro/pro_plus listing/photo limits) | Phase 3 |
| Admin moderation queues + analytics | Phase 3 |

---

## 3.5 Out of Scope (Phase 1–2)

| Concern | Status |
|---------|--------|
| Payment processing (Paystack/Flutterwave) | Phase 3+ — WhatsApp is the contact channel in Phase 1–2 |
| Equipment delivery logistics | Future feature — integrate delivery partners |
| Social auth (Google/Facebook OAuth) | Phase 3+ — phone-first only |
| CRM, invoicing, booking calendar | Phase 3 — vendor business tools |
| Subscription billing | Phase 3 — tier schema ready from Phase 2 |
| Multi-city expansion (outside Lagos) | Post-launch |

---

## 3.6 Key User Flows

### Client: Find and Contact a Vendor
```
Client searches (keyword/category/area)
  → Ranked listings returned (active vendors only)
  → Client taps listing → listing detail page (SSR)
  → Client taps "Contact on WhatsApp"
  → wa.me deep link opens WhatsApp with vendor's number
  → Vendor receives inquiry; booking negotiated externally
```

### Vendor: Onboard and Create Listings
```
Vendor registers (phone OTP)
  → Creates vendor profile (draft)
  → Submits for review (draft → pending)
  → Admin approves (pending → active)
  → Vendor creates listings (service and/or rental)
  → Listings appear in search results
```

### Vendor: Rental Listing Creation
```
Vendor fills rental form (category, quantity, pricePerDay, depositAmount, deliveryOption)
  → createRentalListingSchema validated (shared Zod)
  → API creates Listing + ListingRentalDetails (1:1)
  → Listing visible in search once vendor is active
```

---

## 3.7 What EventTrust Does NOT Own

| External Concern | Owner | Integration |
|-----------------|-------|-------------|
| Phone number verification network | MTN / Airtel / Glo | Via Termii abstraction |
| WhatsApp messaging infrastructure | Meta | wa.me link only; no API |
| Media CDN edge nodes | Cloudinary | Signed URL upload, public CDN read |
| Database backups | Supabase | Managed; confirm backup schedule in Supabase dashboard |
| Email delivery | Resend | Transactional only; not primary auth channel |
| DNS / SSL | Vercel (automatic TLS) | eventtrust.com.ng → Vercel |
| Equipment delivery logistics | Future logistics partners | Out of scope Phase 1–2 |
