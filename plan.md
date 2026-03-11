# MVP Product & Technical Plan V1 - see updated V2 and V3 below

The trusted directory for Lagos event vendors

Product Verified event vendor directory — Caterers, Photographers, Venues

City Lagos, Nigeria (MVP)

Users Clients searching for event vendors + Vendors seeking credibility

Monetisation Free at launch — subscription revenue in V2

Budget $500 – $3,000 (bootstrapped)

Stack Next.js • Supabase • Cloudinary • Termii • Vercel

1. Product Vision
   EventTrust Nigeria is a mobile-first PWA that solves the single biggest problem in Nigerian event planning: you cannot verify whether a vendor is legitimate before paying them a deposit. Today people rely on WhatsApp word-of-mouth, Instagram pages with no reviews, and Nairaland threads. EventTrust replaces all of that with one verified, trusted source.

The MVP focuses on three vendor categories in Lagos — Caterers, Photographers/Videographers, and Venues — and delivers four core promises to every user:

• Every vendor profile is tied to a real, verified phone identity
• Portfolio content is reviewed and confirmed as authentic
• Pricing is transparent and displayed upfront
• Client reviews are linked to confirmed real interactions

2. Users & Jobs To Be Done

CLIENT (Consumer)
"I am planning a wedding/event in Lagos and need trustworthy vendors without relying on WhatsApp recommendations from people I barely know."
Needs:
• Search and filter vendors by category
• See verified identity badges
• Browse authentic portfolios
• Read real client reviews
• See transparent pricing
VENDOR (Supplier)
"I do great work but clients can't tell me apart from unreliable vendors on Instagram. I want my track record to speak for itself."
Needs:
• Easy, fast signup (under 10 mins)
• A verified badge that builds trust
• Portfolio showcase to replace Instagram
• Reviews from real past clients
• Enquiry notifications (WhatsApp/email)

3. MVP Feature Set
   The MVP is intentionally scoped. Every feature not on this list is explicitly deferred to V2. The question for every feature decision: does this help a client find and trust a vendor, or help a vendor prove they are trustworthy?

3.1 Vendor Onboarding Flow

1. Vendor visits site → clicks 'List Your Business'
2. Enters phone number → receives OTP via SMS (Termii)
3. Creates profile: business name, category, Lagos area, bio (max 300 chars)
4. Uploads profile photo (face required — enforced by admin review)
5. Uploads portfolio (max 10 images or 2 short videos, via Cloudinary)
6. Sets pricing: either fixed ranges or 'contact for quote'
7. Submits → profile enters 'Pending Verification' state
8. Admin reviews portfolio for authenticity within 24–48 hrs
9. Profile goes live with ✅ Phone Verified badge

Total vendor signup time target: under 10 minutes. No NIN/ID required at MVP — this is V2.

3.2 Vendor Profile Page
• Trust badge strip: Phone Verified / Portfolio Reviewed / Review Count
• Business name, category tag, Lagos area (e.g. Lekki, VI, Ikeja)
• Bio and pricing display
• Portfolio gallery (images + video thumbnails)
• Client reviews section with star rating and written review
• 'Send Enquiry' button → opens WhatsApp or email (no in-app chat in MVP)
• 'Share Profile' button → generates shareable link (WhatsApp-optimised preview)

3.3 Client Search & Discovery
• Homepage: search bar (category + keyword) + area filter (Lagos neighbourhoods)
• Results page: vendor cards sorted by review score then recency
• Filter panel: category, price range, area, verified only toggle
• Vendor detail page (as above)
• No client account required to browse — friction-free discovery
• Optional client account to leave a review (phone OTP only)

3.4 Review System
• Client creates account with phone OTP
• Selects vendor they worked with, confirms event type and approximate date
• Leaves star rating (1–5) and written review (min 50 chars)
• Admin receives notification → reviews within 24 hrs for spam/policy
• Review goes live with 'Verified Client' label (phone verified)
• Vendor can post one public reply per review
• No review removal except clear policy violation — policy published publicly

3.5 Admin Panel
• Vendor profile queue: approve / request changes / reject with reason
• Portfolio review: flag stolen content, require resubmission
• Review moderation queue: approve / escalate to dispute
• Basic analytics: new signups, active profiles, reviews submitted
• Simple dispute log: record outcome and reasoning for transparency

4. Trust & Verification System

4.1 Trust Badge Ladder
Badges are earned progressively. The visual ladder is displayed on every vendor profile so clients understand the significance of each badge instantly.

Badge How Earned Who Verifies Trust Signal
✅ Phone Verified OTP at signup Automated (Termii) Real person behind account
🖼️ Portfolio Reviewed Admin checks portfolio Human admin (24–48 hrs) Work is authentic, not stolen
⭐ First Review Client leaves review Admin + automated Has a real service track record
🏆 Top Rated 4.5+ stars, 10+ reviews Automated calculation Consistently excellent service

4.2 Dispute Resolution (Simplified for MVP)
Full dispute resolution is complex. The MVP implements a lightweight version that is still transparent and consistent:

10. Review published immediately when approved by admin
11. Vendor can flag a review as disputed within 72 hours
12. Both parties submit evidence via a simple form (screenshot uploads accepted)
13. Admin makes decision within 5 business days — documented in writing
14. Decision references specific policy clause, not just admin judgment
15. One appeal allowed within 48 hours — reviewed by different admin
16. All dispute outcomes logged internally with reasoning

Policy rule: reviews containing provably false facts may be removed. Negative opinions — even harsh ones — stay up. This policy is published publicly on a dedicated page.

5. Technology Stack
   Every choice below is justified by three constraints: small budget, solo full-stack developer, mobile-Android-first users.

Layer Choice Why
Frontend Next.js 15 (App Router) Full-stack in one repo. SSR for SEO (critical — clients will Google event vendors). PWA support built in. Vercel deploy is free.
Styling Tailwind CSS Fast, consistent mobile-first styling. No design system cost. Pairs with shadcn/ui for accessible components.
Backend/DB Supabase Postgres database + auth + file storage + real-time — all free tier. Replaces 4 separate services. Row-level security built in.
Media Cloudinary Portfolio image/video upload, compression, CDN delivery. Free tier handles MVP volume. Automatic mobile optimisation.
SMS/OTP Termii Nigerian OTP/SMS provider. Cheaper than Twilio for NGN numbers. Direct local support. Pay-as-you-go.
Hosting Vercel Free hosting for Next.js. Global CDN. Auto-deploys from GitHub. Zero config.
Email Resend Transactional email (review notifications, dispute updates). Free tier: 3,000 emails/month.
Payments Flutterwave (V2) Payment processing for vendor subscriptions. Not needed in free MVP but architecture should account for it.

6. Database Schema
   All tables live in Supabase (PostgreSQL). Row-level security (RLS) policies enforce that vendors can only edit their own profiles, and clients can only edit their own reviews.

Core Tables

vendors
id (uuid PK) • phone (unique) • name • slug (unique) • category (enum: caterer|photographer|venue) • area • bio • pricing_type (enum: fixed|range|quote) • price_from • price_to • status (enum: pending|active|suspended) • created_at

vendor_portfolio
id • vendor_id (FK) • media_url • media_type (image|video) • caption • sort_order • created_at

clients
id (uuid PK) • phone (unique) • display_name • created_at

reviews
id • vendor_id (FK) • client_id (FK) • event_type • event_date_approx • rating (1–5) • body (min 50 chars) • status (enum: pending|approved|disputed|removed) • created_at

vendor_replies
id • review_id (FK, unique — one reply per review) • vendor_id (FK) • body • created_at

disputes
id • review_id (FK) • raised_by (enum: vendor|client) • vendor_evidence_url • client_evidence_url • status (enum: open|decided|appealed|closed) • admin_decision • policy_clause • decided_at

admin_log
id • action • target_type • target_id • admin_id • notes • created_at — append-only audit trail, never updated or deleted

7. Architecture & Coding Rules
   These rules exist to keep the codebase maintainable by a solo developer and to prevent technical debt that would slow down V2 development.

Rule Why It Matters
Server components by default, client components only when interactivity is needed Reduces JS bundle size — critical for Android users on 3G/4G in Lagos
All DB access through Supabase server-side client only (never expose service key to browser) Security — prevents client-side DB manipulation
One API route per action, not REST collections Simpler to reason about; easier to add rate limiting per action
All vendor status changes go through a single updateVendorStatus() server action with audit log entry Every status change is traceable — critical for dispute investigations
No inline styles — Tailwind classes only Consistency; no specificity wars; easier to maintain
All user-uploaded content routed through Cloudinary, never stored directly in Supabase storage Supabase free tier storage limits; Cloudinary handles compression and CDN
Phone numbers stored in E.164 format (+234XXXXXXXXXX) Consistent format for OTP matching and future WhatsApp API integration
Soft deletes only — never hard-delete vendors or reviews Dispute history must be preserved even if profiles are suspended
Environment variables for all API keys — never commit secrets Security basics — use Vercel environment variable management
Mobile-first CSS — design for 375px width, scale up Target user is on Android mobile, not desktop
All forms have loading and error states — no silent failures Nigerian network conditions mean slow responses; users need feedback

8. Business Logic Rules

Vendor Status Machine
A vendor profile moves through defined states only. No state can be skipped.

draft → pending → active | changes_requested | suspended

• draft → pending: vendor submits completed profile
• pending → active: admin approves portfolio and identity
• pending → changes_requested: admin flags issues; vendor edits and resubmits
• active → suspended: policy violation; vendor notified with specific reason
• suspended → active: only after vendor resolves the violation and admin confirms

Review Business Rules
• A client may leave one review per vendor per calendar year
• Reviews require minimum 50 characters — enforced at DB constraint level, not just UI
• A review in 'disputed' status remains publicly visible with a dispute notice
• A removed review is soft-deleted — the record remains in DB with status = removed
• Vendors may reply once per review — reply can be edited within 48 hours of posting
• Review scores recalculate automatically on every new approved review (no caching of score)
• Vendor overall rating = average of all approved review ratings, rounded to 1 decimal

Search & Ranking Logic
• Primary sort: review score descending (higher rated vendors appear first)
• Tiebreaker 1: number of approved reviews (more reviews = higher)
• Tiebreaker 2: profile completeness score (bio + portfolio + pricing all filled = +weight)
• Tiebreaker 3: recency of last approved review
• Vendors with status != active are excluded from all search results entirely
• 'Verified Only' filter shows vendors with at least Phone Verified + Portfolio Reviewed badges

9. Build Phases

Phase 1: Foundation Weeks 1–3

• Supabase project setup — schema, RLS policies, storage buckets
• Next.js project scaffold — App Router, Tailwind, shadcn/ui, env config
• Termii OTP integration — phone verification flow for vendors and clients
• Vendor signup flow — all steps, Cloudinary portfolio upload
• Basic admin panel — vendor queue, approve/reject
• Vercel deployment pipeline from GitHub

Exit criteria: A vendor can sign up, upload a portfolio, and an admin can approve them.

Phase 2: Core Product Weeks 4–7

• Vendor profile page — full display with badges, portfolio, pricing
• Client search — category filter, area filter, results page
• Client account creation (phone OTP only)
• Review submission flow — client leaves review, admin approves
• Vendor reply to review
• WhatsApp share optimisation — og:image, og:title meta tags for shareable links
• 'Send Enquiry' button — opens WhatsApp with pre-filled message template

Exit criteria: A client can find a vendor, read their profile and reviews, and contact them.

Phase 3: Trust Layer Weeks 8–10

• Dispute submission form — evidence upload, structured fields
• Dispute admin workflow — review, decide, notify both parties
• Admin audit log — every action recorded with admin ID and notes
• Public policy page — plain English, what gets removed and why
• Transparency report page — monthly dispute stats (auto-generated from DB)
• Email notifications via Resend — review approved, dispute update, enquiry received
• PWA configuration — manifest, service worker, install prompt for Android

Exit criteria: The platform can handle a disputed review transparently with documented outcomes.

Phase 4: Launch Prep Weeks 11–12

• SEO — dynamic og:tags per vendor, sitemap.xml, robots.txt
• Performance audit — Core Web Vitals, image optimisation, 3G load test
• Security review — RLS policies tested, OTP rate limiting, file upload validation
• Manual onboarding of first 30–50 Lagos vendors (photographers + caterers first)
• Landing page content — clear value proposition, how it works, vendor CTA
• Soft launch to closed beta group — bridal WhatsApp communities in Lagos

Exit criteria: 30+ active verified vendors, 5+ real client reviews, platform stable under real use.

10. Budget Breakdown (MVP)

Item Monthly Cost Notes
Supabase Free Free tier covers MVP easily
Vercel Free Hobby tier sufficient for MVP traffic
Cloudinary Free 25GB storage + 25GB bandwidth free
Termii SMS/OTP ~$10–30 Pay per SMS — depends on signup volume
Resend (email) Free 3,000 emails/month free
Domain (.com.ng) ~$10/year One-time or annual
Legal review (ToS) ~$100–300 One-time — Nigerian fintech lawyer for ToS
Total ~$20–50/month + one-time legal ~$200

Well within the $500–$3,000 budget even accounting for unexpected costs. The largest variable is Termii OTP cost, which scales with signups — a good problem to have.

11. Deliberately Deferred to V2
    These features are intentionally excluded from the MVP. They are not forgotten — they are sequenced correctly.

• Deposit/escrow payment holding — requires legal structuring first
• NIN/BVN identity verification — adds friction; add after trust in platform is established
• In-app messaging — WhatsApp handles this fine at MVP scale
• Vendor subscription billing via Flutterwave — free launch builds the network first
• Abuja / other cities expansion — prove Lagos works first
• Additional vendor categories (decorators, MCs, etc.)
• Mobile native app (iOS/Android) — PWA serves Android users well enough
• API for third-party integrations / B2B trust score queries
• AI-powered portfolio authenticity detection
• Automated reference checks via WhatsApp API

12. MVP Success Metrics
    These are the numbers that determine whether to proceed to V2 or pivot.

Metric Target (Month 3) Signals V2 is justified
Active verified vendor profiles 50+ 100+
Client review submissions 30+ 100+
Monthly unique visitors 500+ 2,000+
Vendor enquiry clicks (WhatsApp/email) 100+ 500+
Vendor profile completion rate >70% >85%
Dispute rate (disputes / reviews) <10% <5%

Build the trust layer first.
Everything else — payments, expansion, monetisation — follows naturally once Lagosians trust your platform.

# UPDATED V2

1. Architecture Overview
   UPDATED: Entire section new — replaces monorepo Next.js assumption from v1

The platform is split into two separate repositories with clearly defined responsibilities. The NestJS backend owns all business logic, data access, and third-party integrations. Next.js is a pure frontend — it renders UI and calls the NestJS API. Nothing else.

NestJS Backend (api.eventtrust.com.ng) Next.js Frontend (eventtrust.com.ng)
• All Supabase/Postgres access
• OTP logic via Termii
• Cloudinary upload signing
• Email dispatch via Resend
• All business logic & rules
• JWT auth & guards
• Vendor status state machine
• Admin audit logging • Renders all pages and UI
• Calls NestJS API only (no direct DB)
• Manages client-side auth token (httpOnly cookie)
• Server-side rendering for SEO pages
• PWA manifest and service worker
• WhatsApp share meta tags
• No business logic — UI only

The one strict rule: Next.js never accesses Supabase directly. All data flows through the NestJS API. This makes the backend the single source of truth for all business rules and eliminates the risk of bypassing validation at the UI layer.

2. NestJS Module Structure
   UPDATED: Entire section new — maps business logic from v1 to NestJS modules

Every piece of business logic defined in the original plan maps directly to a NestJS module. Modules are self-contained — each owns its own controller, service, and DTOs. No cross-module direct service imports except through clearly defined interfaces.

2.1 Repository Structure
src/
├── auth/ # OTP generation, JWT issue/verify, guards
├── vendors/ # Vendor CRUD, status machine, profile management
├── portfolio/ # Cloudinary upload signing, media management
├── reviews/ # Review submission, approval, reply logic
├── disputes/ # Dispute workflow, evidence upload, decisions
├── search/ # Vendor search, filtering, ranking algorithm
├── admin/ # Admin queue, moderation actions, analytics
├── notifications/ # Resend email + Termii SMS dispatch
├── audit/ # Append-only admin action log
├── common/ # Shared guards, pipes, interceptors, decorators
│ ├── guards/ # JwtAuthGuard, RolesGuard, VendorOwnerGuard
│ ├── pipes/ # ValidationPipe config, phone format pipe
│ ├── interceptors/ # LoggingInterceptor, TransformInterceptor
│ └── decorators/ # @CurrentUser(), @Roles(), @Public()
└── config/ # Environment config via @nestjs/config

2.2 Module Responsibilities

Module Key Files Responsibilities
AuthModule auth.service auth.controller jwt.strategy Phone OTP request + verify via Termii. JWT access token issue (15min) + refresh token (7 days). Guards applied globally — @Public() decorator opts out.
VendorsModule vendors.service vendors.controller vendor-status.service Vendor signup, profile update, status state machine (draft → pending → active etc). All status transitions call AuditService. Vendor can only edit own profile — enforced by VendorOwnerGuard.
PortfolioModule portfolio.service portfolio.controller Generates Cloudinary signed upload URL returned to frontend. Frontend uploads directly to Cloudinary — NestJS never handles binary files. Stores returned media_url in DB after upload confirmation.
ReviewsModule reviews.service reviews.controller review-score.service Review submission with validation (min 50 chars, one per vendor per year). Admin approval queue. Score recalculation on every approval. Vendor reply (one per review, editable 48hrs). Soft deletes only.
DisputesModule disputes.service disputes.controller Dispute submission by vendor within 72hrs of review approval. Evidence collection. Status machine: open → decided → appealed → closed. Both parties notified at each transition via NotificationsModule.
SearchModule search.service search.controller Vendor search by category, area, keyword. Ranking logic: score → review count → profile completeness → recency. Excludes non-active vendors at query level. Never calls other modules directly — queries DB directly for performance.
AdminModule admin.service admin.controller Protected by RolesGuard (role: admin). Vendor approval queue, review moderation, dispute decisions. Every action calls AuditService before completing. Analytics queries.
NotificationsModule notifications.service email.service sms.service Wraps Resend (email) and Termii (SMS). Called by other modules — never exposes HTTP endpoints. Template-based: one method per notification type (e.g. sendReviewApproved(), sendDisputeDecided()).
AuditModule audit.service Single method: log(action, targetType, targetId, adminId, notes). Writes to admin_log table. Never updates or deletes. Called by Vendors, Reviews, Disputes, Admin modules on every state change.

3. Authentication Flow
   UPDATED: Replaces Next.js server action auth from v1 — now fully NestJS JWT

Authentication is phone-OTP based for both vendors and clients. JWT tokens are issued by NestJS and stored as httpOnly cookies on the Next.js side — never in localStorage.

3.1 OTP Flow

1. Frontend calls POST /auth/otp/request with { phone: '+234XXXXXXXXXX' }
2. NestJS validates E.164 format, rate-limits (max 3 requests per phone per 10 mins)
3. Generates 6-digit OTP, stores hash + expiry (10 mins) in DB, calls Termii to send SMS
4. Frontend shows OTP input screen
5. Frontend calls POST /auth/otp/verify with { phone, otp, role: 'vendor'|'client' }
6. NestJS verifies OTP hash, creates or retrieves user record, issues JWT
7. JWT access token (15 min) + refresh token (7 days) returned as httpOnly cookies
8. Next.js middleware checks cookie on protected routes — redirects if expired

3.2 JWT Strategy
// JWT payload shape
{
sub: 'uuid', // user id
phone: '+234...',
role: 'vendor' | 'client' | 'admin',
vendorId: 'uuid' // only present for vendor role
}

// Guard usage in controllers
@UseGuards(JwtAuthGuard) // requires any valid JWT
@UseGuards(JwtAuthGuard, RolesGuard) // requires specific role
@Roles('admin') // admin only
@Roles('vendor') // vendor only
@Public() // no auth required (search, vendor profiles)

4. Key Service Logic
   UPDATED: Business logic from v1 Section 8 mapped to concrete NestJS service methods

4.1 Vendor Status Machine (vendor-status.service.ts)
All vendor status transitions go through a single service method. No controller or other service can update vendor status directly — only through this method.

transition(vendorId, newStatus, adminId?, notes?) {
// 1. Load current vendor status
// 2. Validate transition is legal (see allowed map below)
// 3. Update vendor.status in DB
// 4. Call auditService.log() — always, before returning
// 5. Call notificationsService if vendor needs to be notified
}

// Allowed transitions only:
draft → pending
pending → active | changes_requested | suspended
changes_req → pending (vendor resubmits)
active → suspended
suspended → active (admin lifts suspension only)

4.2 Review Score (review-score.service.ts)
Score recalculates on every review approval — never cached, always live from DB.

recalculate(vendorId) {
// SELECT AVG(rating), COUNT(\*)
// FROM reviews
// WHERE vendor_id = $1 AND status = 'approved'
// UPDATE vendor SET avg_rating, review_count
}

// Called by ReviewsService.approveReview() only
// Never called directly from controllers

4.3 Search Ranking (search.service.ts)
Ranking is applied in the DB query, not in application code, for performance on large datasets.

// Ranking formula applied in ORDER BY:
// (avg*rating * 0.5)
// + (LEAST(review*count, 50) / 50.0 * 0.3) -- capped at 50
// + (profile*complete_score * 0.1)
// + (days*since_last_review_score * 0.1)

// profile_complete_score =
// 1 if (bio + portfolio + pricing all filled), else 0

// Always WHERE status = 'active'
// 'Verified only' filter adds: AND portfolio_reviewed = true

4.4 Portfolio Upload (portfolio.service.ts)
NestJS never receives the binary file. It only generates a signed Cloudinary URL and records the result.

// Step 1: Frontend requests upload
getSignedUploadUrl(vendorId, mediaType) {
// Generate Cloudinary signed URL
// Return { uploadUrl, publicId } to frontend
}

// Step 2: Frontend uploads directly to Cloudinary
// Step 3: Frontend confirms upload to NestJS
confirmUpload(vendorId, publicId, mediaUrl, mediaType) {
// Validate vendor owns this slot
// Check max 10 images / 2 videos not exceeded
// INSERT into vendor_portfolio
}

5. API Endpoint Map
   UPDATED: New section — maps all MVP features to concrete REST endpoints

Method Endpoint Auth Purpose
POST /auth/otp/request Public Request OTP for phone number
POST /auth/otp/verify Public Verify OTP, issue JWT
POST /auth/refresh Public Refresh access token
POST /vendors Public Create vendor profile (draft)
PATCH /vendors/:id Vendor (owner) Update own profile
POST /vendors/:id/submit Vendor (owner) Submit profile for review (draft → pending)
GET /vendors/:slug Public Get vendor public profile
POST /vendors/:id/portfolio/sign Vendor (owner) Get Cloudinary signed upload URL
POST /vendors/:id/portfolio/confirm Vendor (owner) Confirm upload, save media record
DELETE /vendors/:id/portfolio/:mediaId Vendor (owner) Remove portfolio item
GET /search/vendors Public Search + filter vendors (ranked)
POST /reviews Client Submit review for a vendor
POST /reviews/:id/reply Vendor (owner) Reply to a review
PATCH /reviews/:id/reply Vendor (owner) Edit reply (within 48hrs)
POST /disputes Vendor Raise dispute on a review
POST /disputes/:id/evidence Vendor or Client Submit evidence for dispute
GET /admin/vendors/queue Admin Pending vendor approval queue
POST /admin/vendors/:id/approve Admin Approve vendor → active
POST /admin/vendors/:id/request-changes Admin Request changes → changes_requested
POST /admin/vendors/:id/suspend Admin Suspend vendor
GET /admin/reviews/queue Admin Pending review approval queue
POST /admin/reviews/:id/approve Admin Approve review → published
POST /admin/reviews/:id/remove Admin Remove review (policy violation)
GET /admin/disputes/queue Admin Open disputes queue
POST /admin/disputes/:id/decide Admin Record dispute decision
GET /admin/analytics Admin Platform stats dashboard

6. Technology Stack
   UPDATED: Updated from v1 — NestJS replaces Next.js API routes; Railway added for backend hosting

Layer Repo Choice Why
API Backend NestJS (existing) Already built. Modular architecture maps perfectly to business domains. Guards, pipes, interceptors solve auth and validation cleanly.
Database Backend Supabase (Postgres) Accessed only via NestJS — never from frontend. Free tier covers MVP. Postgres gives full SQL power for ranking queries.
OTP / SMS Backend Termii Nigerian provider — cheaper than Twilio for NGN numbers. Called only from NotificationsModule.
Media Backend + CDN Cloudinary NestJS signs upload URLs. Frontend uploads directly. CDN delivery handles Lagos bandwidth constraints automatically.
Email Backend Resend Called from NotificationsModule only. 3,000 free emails/month covers MVP.
Frontend Frontend Next.js 15 (App Router) SSR for SEO on vendor profile pages. PWA for Android install. Pure UI layer — no business logic.
Styling Frontend Tailwind + shadcn/ui Mobile-first. Accessible components. No per-component CSS overhead.
Backend host Backend Railway Free tier for Node.js. Deploys from GitHub. Handles NestJS well. Upgrade path is simple.
Frontend host Frontend Vercel Native Next.js support. Free tier. Global CDN. Auto-deploys from GitHub.
Payments (V2) Backend Flutterwave Vendor subscriptions in V2. Architecture accounts for it now — PaymentsModule scaffold only in MVP.

7. Architecture & Coding Rules
   UPDATED: Updated from v1 — NestJS-specific rules added; Next.js server action rules removed

7.1 NestJS Backend Rules

Rule Why It Matters
Supabase client instantiated once in a DatabaseModule — injected everywhere via DI Prevents multiple connection pools; single config point
Every state-changing endpoint calls AuditService before returning — no exceptions Complete audit trail for disputes and admin accountability
No direct cross-module service imports — use events or shared interfaces Prevents circular dependencies as codebase grows
ValidationPipe applied globally with whitelist: true, forbidNonWhitelisted: true Strips unexpected fields — prevents mass assignment attacks
All DTOs use class-validator decorators — no manual validation in services Consistent, testable validation at the boundary
Phone numbers validated to E.164 format in a custom pipe before any service sees them Consistent format for OTP matching and future WhatsApp integration
Rate limiting on OTP endpoints: 3 requests per phone per 10 minutes Prevents SMS bombing — Termii costs money per SMS
Soft deletes only — never call DELETE on vendors, reviews, or disputes tables Dispute history must survive profile suspension or review removal
Admin endpoints protected by both JwtAuthGuard AND RolesGuard('admin') — both required Defense in depth — two independent checks for sensitive routes
VendorOwnerGuard checks req.user.vendorId === params.id before any vendor mutation Vendor A cannot modify Vendor B's profile even with a valid JWT

7.2 Next.js Frontend Rules

Rule Why It Matters
Never access Supabase directly from Next.js — all data through NestJS API Single source of truth; business rules cannot be bypassed from UI
JWT stored in httpOnly cookie only — never localStorage or sessionStorage XSS-proof token storage
Server components for all data-fetching pages (vendor profiles, search results) Reduces JS bundle — critical for Android 3G users
Client components only for interactive elements (forms, OTP input, file upload) Keeps bundle lean while enabling necessary interactivity
All API calls wrapped in a typed apiClient utility — no raw fetch() in components Centralises error handling, auth header injection, base URL config
Mobile-first CSS — design for 375px, scale up to desktop Primary users are on Android mobile
All forms show loading state and error state — no silent failures Nigerian network latency means users need constant feedback
og:image, og:title, og:description set dynamically on vendor profile pages WhatsApp share previews are a primary discovery mechanism

8. Database Schema
   Unchanged from v1 — schema is independent of backend framework. All access is via NestJS only; no RLS policies required since the DB is never exposed to the browser.

vendors
id (uuid PK) • phone (unique) • name • slug (unique) • category (enum: caterer|photographer|venue) • area • bio • pricing_type (enum: fixed|range|quote) • price_from • price_to • avg_rating (decimal) • review_count (int) • profile_complete_score (int) • portfolio_reviewed (bool) • status (enum: draft|pending|active|changes_requested|suspended) • created_at

vendor_portfolio
id • vendor_id (FK) • media_url • public_id (Cloudinary) • media_type (image|video) • caption • sort_order • created_at

clients
id (uuid PK) • phone (unique) • display_name • created_at

otp_requests
id • phone • otp_hash • expires_at • used (bool) • created_at — cleaned up by cron job

reviews
id • vendor_id (FK) • client_id (FK) • event_type • event_date_approx • rating (1–5) • body (min 50 chars) • status (enum: pending|approved|disputed|removed) • created_at

vendor_replies
id • review_id (FK, unique) • vendor_id (FK) • body • editable_until (timestamp: created_at + 48hrs) • created_at

disputes
id • review_id (FK) • raised_by_vendor_id (FK) • vendor_evidence_url • client_evidence_url • status (enum: open|decided|appealed|closed) • admin_decision • policy_clause • decided_at

admin_log
id • action • target_type • target_id • admin_id • notes • created_at — append-only, no updates or deletes ever

9. Build Phases
   UPDATED: Updated from v1 — Phase 1 now starts from existing NestJS codebase

Phase 1: NestJS Foundation Weeks 1–3

You already have a NestJS project. Phase 1 adapts it to this domain.

• Scaffold all 9 modules (auth, vendors, portfolio, reviews, disputes, search, admin, notifications, audit)
• DatabaseModule with Supabase client — injected into all service modules
• AuthModule — Termii OTP integration, JWT strategy, JwtAuthGuard, RolesGuard, VendorOwnerGuard
• VendorsModule — signup, profile creation, VendorStatusService state machine
• AuditModule — append-only log service, wired into VendorStatusService
• Next.js project scaffold — Tailwind, shadcn/ui, typed apiClient utility, httpOnly cookie auth
• Vercel + Railway deployment pipelines from GitHub

Exit criteria: A vendor can sign up via OTP, create a profile, and an admin can change its status — all logged in audit table.

Phase 2: Core Product Weeks 4–7

• PortfolioModule — Cloudinary signed URL generation, upload confirmation, media records
• ReviewsModule — submission, admin approval queue, score recalculation, vendor reply
• SearchModule — ranked query, category/area/keyword filters
• NotificationsModule — Resend email + Termii SMS templates wired to vendor and review events
• Next.js pages: vendor profile, search results, review submission, vendor dashboard
• WhatsApp share meta tags on vendor profile pages
• 'Send Enquiry' → opens WhatsApp with pre-filled message

Exit criteria: A client can search, find a verified vendor, read reviews, and send a WhatsApp enquiry.

Phase 3: Trust Layer Weeks 8–10

• DisputesModule — full dispute workflow, evidence upload, decision recording, appeal handling
• AdminModule — full moderation dashboard, dispute queue, analytics endpoint
• Public policy page (Next.js static page — no API needed)
• Transparency report page (calls GET /admin/analytics with public-safe subset)
• PWA configuration — manifest, service worker, Android install prompt
• CORS hardened — only allow Next.js production domain

Exit criteria: A full dispute can be raised, decided, and appealed — all steps documented in audit log.

Phase 4: Launch Prep Weeks 11–12

• SEO — dynamic og:tags per vendor profile, sitemap.xml, robots.txt
• Performance — Core Web Vitals audit, Cloudinary image optimisation, 3G load test
• Security review — OTP rate limiting stress tested, all admin routes verified dual-guarded
• Manual onboarding of first 30–50 Lagos vendors (photographers + caterers first)
• Soft launch to Lagos bridal WhatsApp communities and event planning Facebook groups

Exit criteria: 30+ active verified vendors, 5+ real reviews, platform stable under real traffic.

10. Budget Breakdown
    UPDATED: Railway added for NestJS backend hosting — still within $500–$3,000 budget

Item Monthly Cost Notes
Supabase Free Free tier covers MVP comfortably
Vercel (Next.js) Free Hobby tier sufficient for MVP traffic
Railway (NestJS) Free → ~$5 Free tier: 500hrs/month. Upgrade if needed.
Cloudinary Free 25GB storage + 25GB bandwidth free
Termii SMS/OTP ~$10–30 Pay per SMS — scales with signups
Resend (email) Free 3,000 emails/month free tier
Domain (.com.ng) ~$10/year One-time annual cost
Legal review (ToS) ~$100–300 One-time — Nigerian lawyer for ToS before launch
Total ~$20–50/month + ~$200 one-time legal cost

11. Sections Unchanged From v1
    The following sections from the original plan are identical in this NestJS version. Refer to v1 for full detail.

• Product Vision — unchanged
• Users & Jobs To Be Done — unchanged
• MVP Feature Set (vendor onboarding, profile, search, review system, admin panel) — unchanged
• Trust & Verification System (badge ladder, dispute resolution) — unchanged
• Business Logic Rules (review rules, search ranking logic, status machine rules) — moved to NestJS services but rules identical
• Deliberately Deferred to V2 — unchanged
• MVP Success Metrics — unchanged

Your existing NestJS codebase is an advantage, not a constraint.
The architecture is cleaner with a dedicated API layer. Start with Phase 1 module scaffolding.

# V3 update regarding auth

How the data model looks
Instead of storing auth credentials directly on the user record, you have a separate table:

users
id · display_name · role · created_at

auth_identities
id · user_id (FK) · provider (enum: phone|google|facebook)
· provider_user_id · created_at

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
