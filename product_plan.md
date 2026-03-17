# Event Services & Equipment Marketplace – Product Plan

## 1. Product Vision

Create a **mobile-first marketplace for the events industry in Nigeria** that connects clients with vendors who provide:

- Event **services** (catering, photography, DJs, decorators, planners)
- Event **equipment rentals** (tents, chairs, cooking equipment, generators, lighting, decor)

The platform will initially function as a **lead generation and vendor management platform**, with transactions handled directly between clients and vendors (typically via WhatsApp). Payment processing and escrow infrastructure will be introduced in a later phase.

The platform’s main value proposition:

- Help clients easily **find trusted vendors**
- Help vendors **get leads and manage their business operations**
- Build the infrastructure for **future transaction-based monetization**
- Build trust through Badges and review/dispute system

Admin Panel
• Vendor profile queue: approve / request changes / reject with reason - not in MVP
• Portfolio review: flag stolen content, require resubmission - not in MVP
• Review moderation queue: approve / escalate to dispute - how to implement?
• Basic analytics: new signups, active profiles, reviews submitted
• Simple dispute log: record outcome and reasoning for transparency

---

# 2. Strategic Approach

## Phase 2 – Platform Business Tools

Increase vendor dependency on the platform.

Introduce tools such as:

- CRM (customer management)
- Booking calendar
- Inventory management
- Invoicing
- Payment link creation

Goal: platform becomes vendor **daily workflow hub**.

---

## Phase 3 – Platform Transactions

Once sufficient activity exists:

- Optional escrow payments
- Deposits for rentals
- Booking protection
- Commission per transaction

Goal: introduce **3–8% transaction fees**.

---

# 3. Marketplace Scope

The platform will focus on a **vertical marketplace for events**, not a general rental marketplace.

## Initial Categories

### Services

- Catering
- Photography
- DJs
- Decorators
- Event planners

### Rentals

- Tents
- Chairs & tables
- Cooking equipment
- Generators
- Lighting

Launch with **a limited number of categories** to maintain liquidity.

---

# 4. User Roles

The system supports **multiple roles under one account**.

Users may be:

- Clients
- Service providers
- Equipment rental vendors
- Vendors offering both services and rentals

Example structure:

```
User Account
 ├─ Client
 ├─ Service Provider
 └─ Equipment Owner
```

Users can activate vendor roles after registration.

---

# 5. Vendor Profile Model

Each vendor has a unified business profile.

Vendor profile contains:

- Business name
- Description
- Location
- Phone / WhatsApp
- Photo gallery
- Reviews
- Listings

Vendor page structure:

```
Vendor Profile

Services
 - Catering
 - Event planning

Equipment Rentals
 - Cooking pots
 - Serving trays
 - Gas burners
```

This reflects real vendor businesses which often provide both services and equipment.

---

# 6. Listing Types

The system supports two listing types.

## Service Listings

Fields include:

- Service category
- Price per event/hour
- Service area
- Team size
- Availability calendar
- Photos
- Description

Example:
Catering service for weddings.

---

## Rental Listings

Fields include:

- Price per day
- Quantity available
- Deposit amount
- Pickup/delivery options
- Condition
- Photos
- Description

Example:
50 event chairs available for rent.

---

## Shared Listing Features

Both listing types include:

- Vendor profile
- Reviews
- Messaging
- Photos
- Location
- Ratings

---

# 7. Booking Model (Phase 1)

The platform will not initially process payments.

Instead:

### Client Flow

1. Client searches marketplace
2. Client selects listing
3. Client clicks **Contact via WhatsApp**
4. Vendor receives inquiry
5. Booking negotiated externally

Users must be logged in to contact vendors.

---

# 8. Dashboard

Vendors/renters will have a central dashboard to manage their business. Clients have their central dashboard with simple client tools and to see invoices and the reviews they have left

Example dashboard structure:

```
Vendor Dashboard

Listings
  Services - done
  Rentals - done

Bookings
  Service inquiries
  Rental inquiries

Tools
  Calendar
  Customers
  Invoices - partially done
  Analytics
```

---

# 9. Vendor Business Tools (Pro Features)

These tools drive subscription revenue.

## Customer Management (CRM)

Track:

- Client name
- Event date
- Contact info
- Quote status
- Notes

Purpose: replace manual tracking via notebooks or WhatsApp.

---

## Booking Calendar

Used for:

- Caterers
- Photographers
- Decorators

Prevents double bookings.

---

## Inventory Management

For rental vendors.

Track:

- Equipment quantity
- Availability
- Maintenance notes

Example:

```
Chairs: 120 available
Booked: 80
Available: 40
```

---

## Professional Invoices

Vendors can generate:

- Branded invoices - done
- Payment links
- Receipts

Payments may occur externally but the platform generates the documentation.

---

## Vendor Mini Website

Each vendor receives a profile page:

```
platform.com/vendor-name
```

Features:

- Portfolio
- Reviews
- Services
- Equipment listings
- WhatsApp contact button

Many SMEs lack websites, so this is valuable.

---

# 10. Client Tools (Optional Monetization)

## Event Budget Tool

Features:

- Budget calculator - done
- Vendor checklist
- Event cost breakdown

Possible price:
₦1,000–₦3,000.

---

## Event Website Builder

Create simple event pages.

Example:

```
weddingofadaandchidi.com
```

Features:

- Event schedule
- Location map
- RSVP
- Photo gallery

Possible price:
₦5,000–₦15,000.

---

# 11. Vendor Subscription Model

## Free Tier

- Basic listing
- Limited photos
- WhatsApp contact
- Limited leads
- Platform branding

---

## Pro Tier

- More listings
- Verified badge
- Analytics
- CRM tools
- Booking calendar
- Professional invoices

Expected price range:
₦3,000–₦7,000/month.

---

## Pro+ Tier

- Inventory management
- Vendor website
- Advanced analytics
- Higher search ranking

Expected price range:
₦10,000–₦20,000/month.

---

# 12. Trust and Verification

Trust is critical in Nigerian marketplaces.

Minimum safeguards:

### Vendor verification

Possible methods:

- Phone verification - done through OTP
- Bank verification
- National ID or BVN
- Profile review

---

### Vendor trust

- Trust Badge Ladder - Badges are earned progressively. The visual ladder is displayed on every vendor profile so clients understand the significance of each badge instantly.

Badge How Earned Who Verifies Trust Signal
✅ Phone Verified OTP at signup Automated (Termii) Real person behind account
🖼️ Portfolio Reviewed Admin checks portfolio Human admin (24–48 hrs) Work is authentic, not stolen
⭐ First Review Client leaves review Admin + automated Has a real service track record
🏆 Top Rated 4.5+ stars, 10+ reviews Automated calculation Consistently excellent service

---

#### Review System

• Client sees listings they have "inquired" about - there should be a possibility to leave a review if and when the vendor/renter has sent an invoice to this client / a booking has taken place
• Client leaves star rating (1–5) and written review (min 50 chars)
• Backend reviews for spam/policy
• Review goes live with 'Verified Client' label (phone verified and booking verified)
• Vendor can post one public reply per review
• No review removal except clear policy violation — policy published publicly
• Reviews require minimum 50 characters — enforced at DB constraint level, not just UI
• A review in 'disputed' status remains publicly visible with a dispute notice
• A removed review is soft-deleted — the record remains in DB with status = removed
• Vendors may reply once per review — reply can be edited within 48 hours of posting

Ratings system:

- Vendor rating (average of all approved listing review ratings, rounded to 1 decimal)
- Listing-specific rating (done by verified clients and used as a base to calculate vendor rating)

Example:

Vendor rating:
4.7 / 5

Catering service:
4.8 / 5

### Dispute Resolution (Simplified for MVP)

Full dispute resolution is complex. The MVP implements a lightweight version that is still transparent and consistent:

- Review published immediately when backend has scanned for spam/policy
- Vendor can flag a review as disputed within 72 hours
- Both parties submit evidence via a simple form (screenshot uploads accepted)
- Admin makes decision within 5 business days — documented in writing
- Decision references specific policy clause, not just admin judgment
- One appeal allowed within 48 hours
- All dispute outcomes logged internally with reasoning

Policy rule: reviews containing provably false facts may be removed. Negative opinions — even harsh ones — stay up. This policy is published publicly on a dedicated page.

- DisputesModule — full dispute workflow, evidence upload, decision recording, appeal handling
- AdminModule — full moderation dashboard, dispute queue, analytics endpoint
- Public policy page (Next.js static page — no API needed)
- Transparency report page (calls GET /admin/analytics with public-safe subset)
- PWA configuration — manifest, service worker, Android install prompt
- CORS hardened — only allow Next.js production domain
  Exit criteria: A full dispute can be raised, decided, and appealed — all steps documented in audit log.

---

# 13. Logistics Integration (Future Feature)

Integrate delivery partners for equipment rentals.

Example workflow:

Client rents equipment → vendor requests delivery.

Platform may:

- suggest delivery providers
- estimate delivery cost
- send delivery request

Potential revenue:

- logistics referral fee
- delivery commission

---

# 14. Payment Infrastructure (Future Phase)

Even though payments are not initially implemented, the architecture should support them.

Database objects should include:

```
Booking
Invoice
Payment
Deposit
Commission
```

Future payment features:

- escrow payments
- deposits for rentals
- secure bookings
- dispute resolution

Commission model:

3–8% per transaction.

---

# 15. Social Login (Future Phase)

How the data model looks
Instead of storing auth credentials directly on the user record, you have a separate table:

A user can have multiple rows in auth_identities — one per connected login method. When someone logs in with Google, you look up their Google ID in auth_identities, find the linked user_id, and issue your JWT. That's it. The JWT payload and everything downstream never changes regardless of how they logged in.

Force phone OTP at signup, add social login later
This is the right choice for your platform specifically, for three reasons. First, phone verification is your trust foundation — every vendor and client on EventTrust needs a verified Nigerian phone number because it's your primary identity signal. If someone signs up with Google using a Gmail address, you have no verified phone, which breaks your trust model. Second, it's simpler to build correctly the first time. Third, it matches Nigerian user behaviour — most of your users are more comfortable with OTP than OAuth flows.
After signup, you let users connect additional login methods in their settings. So a vendor signs up with phone OTP, then later connects their Google account so they can log in either way. But the phone number is always there, always verified, always the anchor identity.

Phone OTP required at signup. Social login available as an additional login method after account creation. Here's how this works in practice:
At signup, user provides phone → OTP → account created with verified phone. In account settings, user can connect Google or Facebook — this adds a row to auth_identities linking their Google/Facebook ID to their existing account. Next time they hit "Login with Google", you find their Google ID in auth_identities, retrieve the user, issue JWT. If someone tries to sign up with Google and their Google email matches no existing account, you redirect them to the phone signup flow rather than creating an account — with a friendly message explaining why.
The account linking edge case you must handle
The dangerous scenario is when someone tries to connect a social account that's already linked to a different user. For example, user A signs up with phone, then connects their Google account. Later, user B tries to connect the same Google account. Your code must detect this and reject it — one Google identity can only ever link to one user account.
How this maps to NestJS modules
Your existing AuthModule expands to handle three strategies cleanly using Passport.js, which NestJS has first-class support for:

auth/
├── strategies/
│ ├── jwt.strategy.ts # already planned
│ ├── phone-otp.strategy.ts # signup + primary login
│ ├── google.strategy.ts # secondary login only
│ └── facebook.strategy.ts # secondary login only
├── guards/
│ ├── jwt-auth.guard.ts
│ └── social-auth.guard.ts
└── auth.service.ts # findOrRejectBySocialIdentity() # linkIdentityToUser() # unlinkIdentity()

The key method in auth.service.ts is findOrRejectBySocialIdentity() — when a social login comes in, it either finds an existing linked account and issues a JWT, or rejects and tells the frontend to go through phone signup first. It never silently creates a new account from a social login.
The session vs JWT question for social login
One practical consideration: Google and Facebook OAuth use redirect flows, which means the callback lands on your NestJS backend and then needs to redirect to your Next.js frontend with a token. The cleanest pattern is for NestJS to issue your standard JWT as a short-lived URL parameter on the redirect — something like https://eventtrust.com.ng/auth/callback?token=xxx — and Next.js immediately exchanges that for an httpOnly cookie and discards the URL parameter. Never leave the token sitting in the URL for longer than the redirect takes.
What to build in MVP vs later
For MVP, phone OTP is sufficient and correct. Social login adds complexity and OAuth app approvals from Google and Facebook take time. The pragmatic sequence is phone OTP at launch, Google login in V2 after you have real users, Facebook login in V3 if your analytics show users want it. Build the auth_identities table structure now so adding social providers later requires zero database changes — just a new strategy file.
The one thing to do in MVP even without social login is build the auth_identities table rather than storing the phone directly on the user record. That single architectural decision means adding Google login later is a one-day job instead of a migration headache.

# 16. Core Platform Features (MVP)

Essential features:

- user authentication
- vendor/renter and client profiles
- service listings
- rental listings
- search and filtering
- WhatsApp contact integration
- reviews, ratings and disputes
- vendor/renter dashboard and client dashboard
- CRM basic tools

---

# 17. Platform Growth Strategy

Initial growth approach:

1. Onboard **event vendors manually**
2. Create high-quality listings
3. Focus on **one city initially**
4. Encourage vendors to request reviews from clients
5. Build reputation and trust

Marketplace growth loop:

```
Client finds vendor
→ Vendor books event
→ Client leaves review
→ Vendor gains visibility
→ Vendor receives more leads
```

Long-Term Vision

Platform evolution:

```
Lead marketplace
→ Vendor business platform
→ Transaction marketplace
→ Financial services ecosystem
```

Potential future products:

- vendor loans
- equipment financing
- rental insurance
- vendor analytics
- Deposit/escrow payment holding — requires legal structuring first
- NIN/BVN identity verification — adds friction; add after trust in platform is established
- In-app messaging — WhatsApp handles this fine at MVP scale
- Vendor subscription billing via Flutterwave — free launch builds the network first
- Abuja / other cities expansion — prove Lagos works first
- Additional vendor categories (decorators, MCs, etc.)
- Mobile native app (iOS/Android) — PWA serves Android users well enough
- API for third-party integrations / B2B trust score queries
- AI-powered portfolio authenticity detection
- Automated reference checks via WhatsApp API

---

# 18. Guiding Principles

Product design priorities:

1. **Simple mobile-first interface**
2. **Low bandwidth usage**
3. **Strong trust signals**
4. **Minimal onboarding friction**
5. **High vendor utility**

The system must feel easy for users with **limited technical experience** while maintaining the infrastructure for future transaction processing.

---

End of document.
