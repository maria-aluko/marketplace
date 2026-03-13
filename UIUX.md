# UI/UX Audit & Improvement Plan — EventTrust Nigeria

## Current Implementation Inventory

### Pages (14 routes)

| Route                             | Type            | Status   | Notes                                                                       |
| --------------------------------- | --------------- | -------- | --------------------------------------------------------------------------- |
| `/`                               | Server          | Built    | Dual-path CTAs, service/equipment category grids, featured listings/vendors |
| `/login`                          | Client          | Built    | Two-step OTP flow (request → verify)                                        |
| `/services`                       | Server + Client | Built    | Listing-centric search for services, filters, infinite scroll               |
| `/equipment`                      | Server + Client | Built    | Listing-centric search for equipment, rental filters, infinite scroll       |
| `/search`                         | Server + Client | Built    | Vendor search (demoted, preserved for backwards compat)                     |
| `/vendors/[slug]`                 | Server          | Built    | Hero, listings, portfolio gallery, reviews, sticky action bar               |
| `/listings`                       | —               | Redirect | Redirects to `/services`                                                    |
| `/listings/[id]`                  | Server          | Built    | Detail with vendor trust signals, share button, WhatsApp CTA                |
| `/reviews/new/[vendorId]`         | Server + Client | Built    | Star rating + review body form                                              |
| `/dashboard`                      | Client          | Built    | Tabbed: Overview, Profile, Portfolio, Reviews                               |
| `/dashboard/listings`             | Client          | Built    | Listing management with delete                                              |
| `/dashboard/listings/new/service` | Client          | Built    | Service listing form                                                        |
| `/dashboard/listings/new/rental`  | Client          | Built    | Rental listing form                                                         |
| `/vendor/signup`                  | Server          | Built    | 4-step wizard                                                               |

### Components (35+)

**Auth:** OtpRequestForm, OtpVerifyForm
**Layout:** Header (sticky), Footer, MobileNav (hamburger overlay), AuthNavLinks (auth-aware — "Services" + "Equipment" nav links)
**Vendor:** VendorCard (search result), ListingCard, PortfolioGallery (lightbox modal), ReviewsList, EnquiryButton (WhatsApp), ShareButton (WhatsApp + copy link + native share — supports vendor and listing URLs), VendorActionBar (sticky bottom mobile), WriteReviewButton (auth-gated)
**Listings:** ServiceListingForm, RentalListingForm, ListingSearchCard (listing result with embedded vendor summary — rating, area, verified badge)
**Reviews:** ReviewForm (star rating + character count)
**Search:** SearchPageClient (vendor search — filters, debounced fetch, infinite scroll), ListingSearchPageClient (listing search — service/rental filters, infinite scroll, URL sync)
**Home:** HeroSearch (submits to `/services`)
**Dashboard:** PortfolioUploader (drag-drop, progress bars, Cloudinary), PortfolioManager (grid + delete dialog), ProfileEditForm (status-aware, resubmit for changes_requested), ReviewsManager (reply + edit with 48h window)
**UI Primitives:** Button (CVA 6 variants), Card, Input, Label, Badge (5 variants), Dialog, DropdownMenu, Select, Progress, Tabs, Textarea, Skeleton (pulse), StarRating (interactive + readonly, 4 sizes incl. xs), PhotoCarousel (CSS scroll-snap + dot indicators), ProfileCompletenessRing (SVG circular progress)

### What's Working Well

- **Listing-centric discovery** with dual-path CTAs on landing page ("Find Services" → `/services`, "Rent Equipment" → `/equipment`), category grids for both services and equipment, and featured listing carousels with embedded vendor info
- **Listing search** (`/services`, `/equipment`) has type-specific filters (category, rental category, delivery option, price range), debounced input, URL sync, skeleton loading, and infinite scroll with `ListingSearchCard` results showing vendor summary (name, rating, area, verified badge)
- **Listing detail** has vendor trust signals (star rating, review count, verified badge), WhatsApp CTA, share button, rental details with delivery icons, photo carousel, and similar listings
- **Navigation** clearly surfaces dual discovery paths: "Services" and "Equipment" links in both desktop and mobile nav
- **Vendor search** preserved at `/search` for backwards compatibility
- **Vendor profile** has cover image hero, star rating, category/area badges, price range, listings grid, portfolio lightbox, reviews with vendor replies, and a sticky WhatsApp/Share action bar on mobile
- **Portfolio upload** has drag-and-drop, file validation (type + size), progress bars via XHR, and usage counters ("3/10 images")
- **Reviews manager** enforces 48h edit window, shows "Edit window expired" text, and validates reply length
- **Auth flow** has fixed +234 prefix (non-editable), auto-focus, paste support, Web OTP API auto-fill (Android Chrome), "Didn't receive?" helper text, resend countdown, and redirect parameter support
- **Vendor signup** has a 4-step wizard with progress indicator, step validation, visual category tiles (Lucide icons in 2-column grid), and localStorage draft persistence (24h expiry with restore banner)

---

## Bugs & Issues to Fix

### 7. Footer links are placeholder `#` hrefs

**File:** [footer.tsx](apps/web/src/components/layout/footer.tsx)
About, Contact, and Terms all link to `#`.

---

## Missing Infrastructure

### ~~No error boundaries~~ ✅ PARTIALLY FIXED

Global `error.tsx` added at [app/error.tsx](apps/web/src/app/error.tsx) with a Card UI showing "Something went wrong" message and a "Try Again" retry button.
**Remaining:** Add route-specific `error.tsx` for `app/dashboard/error.tsx` with more contextual error messages.

### No PWA manifest or service worker

Referenced in docs as critical for the target demographic but not implemented.

---

## UI Improvement Suggestions

### Priority 4 — Dashboard improvements

**Current state:** Tabbed dashboard (Overview, Profile, Portfolio, Reviews) with profile edit form, portfolio manager with upload, and reviews manager with reply. Overview tab is very basic (phone, role, vendor profile link, listings link).

**Improvements:**

- **Status-aware overview:** The overview should change significantly based on vendor status:
  - **DRAFT:** Show a profile completeness checklist. The backend already calculates `profileCompleteScore`. Display it as a progress bar with specific calls-to-action: "Add a description", "Set your price range", "Add your WhatsApp number". Each links to the Profile tab.
  - **PENDING:** Show "Your profile is under review" with a timeline/status indicator.
  - **ACTIVE:** Show quick stats: average rating, review count, listing count, portfolio count. Add a quick link to "View Public Profile" (`/vendors/{slug}`).
  - **CHANGES_REQUESTED:** This state is already handled well in ProfileEditForm. Promote it to the Overview tab too so vendors see it immediately.
  - **SUSPENDED:** Show clear explanation and support contact.
- **Quick stats cards:** Add 4 stat cards at the top of the Overview for ACTIVE vendors: Listings (count), Reviews (count), Rating (avg), Portfolio (count). Use the Card component with large numbers.
- **"View Public Profile" link:** Add a prominent link to the vendor's public page so they can see what clients see.
- **Bottom navigation:** For the dashboard section, replace the tab bar with a fixed bottom nav bar (Dashboard/Listings/Portfolio/Reviews/Profile). The current tabs scroll horizontally and are easy to miss. Bottom nav is standard in Nigerian fintech apps (OPay, Kuda, PalmPay).

## Constraints Shaping All Decisions

| Constraint                   | UX Implication                                                                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 85% Android, 1–3GB RAM       | No heavy animations, virtualize long lists, avoid large component trees                                                                           |
| 2G/3G primary, ≤200KB JS     | Skeleton screens (implemented), progressive image loading (implemented via Cloudinary transforms + lazy loading), no client-side search libraries |
| 375px baseline (Tecno Spark) | Single-column layouts, full-width cards (implemented)                                                                                             |
| 44px min touch targets       | Large buttons (mostly implemented), generous spacing (needs audit)                                                                                |
| WhatsApp as primary channel  | og:image on shareable pages (partially — no dynamic OG images yet)                                                                                |
| Phone OTP only               | Minimize auth friction (auto-focus, fixed +234 prefix, Web OTP API — all implemented)                                                             |
| Lagos only (22 areas)        | Area selector as a simple list (implemented via Select)                                                                                           |
| No payments (Phase 1–2)      | No cart/checkout complexity (correct)                                                                                                             |
| Sessions interrupted         | Auto-save forms to localStorage (vendor signup implemented, other forms not yet)                                                                  |

---

## Further Considerations

1. **Bottom nav vs tabs for dashboard** — A fixed bottom nav is more discoverable than the current tab bar. Standard in Nigerian apps. Recommended for Phase 2 dashboard redesign.

2. **Dynamic OG images** — WhatsApp is the primary discovery channel. Using `@vercel/og` to generate images with vendor name + rating + cover photo baked in would significantly improve share previews.

3. **Pidgin English copy** — Consider Pidgin for marketing copy: "Find beta vendors for your owambe" feels more local. Keep form labels in standard English.
