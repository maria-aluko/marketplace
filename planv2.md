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

---

# 2. Strategic Approach

## Phase 1 – Lead Marketplace

Focus on discovery, vendor tools, and communication.

Key characteristics:

- Client finds vendor
- Client contacts vendor via WhatsApp
- Vendor manages booking externally
- Vendor pays subscription to receive leads and access business tools

Revenue model:

- Vendor subscription tiers
- Optional client tools (event planning tools, event websites)

---

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
2. Client selects vendor/listing
3. Client clicks **Contact via WhatsApp**
4. Vendor receives inquiry
5. Booking negotiated externally

Users must be logged in to contact vendors.

---

# 8. Vendor Dashboard

Vendors will have a central dashboard to manage their business.

Example dashboard structure:

```
Vendor Dashboard

Listings
  Services
  Rentals

Bookings
  Service inquiries
  Rental inquiries

Tools
  Calendar
  Customers
  Invoices
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

- Branded invoices
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

- Budget calculator
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

- Phone verification
- Bank verification
- National ID or BVN
- Profile review

---

### Reviews

Ratings system:

- Vendor rating
- Listing-specific rating

Example:

Vendor rating:
4.7 / 5

Catering service:
4.8 / 5

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

# 15. Core Platform Features (MVP)

Essential features:

- user authentication
- vendor profiles
- service listings
- rental listings
- search and filtering
- WhatsApp contact integration
- reviews and ratings
- vendor dashboard
- CRM basic tools

---

# 16. Platform Growth Strategy

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

---

# 17. Long-Term Vision

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

---

# 18. Success Metrics

Key metrics to track:

- number of vendors
- vendor subscription conversion rate
- number of inquiries
- vendor response rate
- monthly active vendors
- client repeat usage

# 19. Guiding Principles

Product design priorities:

1. **Simple mobile-first interface**
2. **Low bandwidth usage**
3. **Strong trust signals**
4. **Minimal onboarding friction**
5. **High vendor utility**

The system must feel easy for users with **limited technical experience** while maintaining the infrastructure for future transaction processing.

---

End of document.
