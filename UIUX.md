# UI/UX Audit & Improvement Plan — EventTrust Nigeria

## Current Implementation Inventory

### Pages (11 routes)

| Route                             | Type            | Status | Notes                                                         |
| --------------------------------- | --------------- | ------ | ------------------------------------------------------------- |
| `/`                               | Client          | Built  | Hero + search bar + category grid                             |
| `/login`                          | Client          | Built  | Two-step OTP flow (request → verify)                          |
| `/search`                         | Server + Client | Built  | Filters, infinite scroll, skeleton loading, vendor cards      |
| `/vendors/[slug]`                 | Server          | Built  | Hero, listings, portfolio gallery, reviews, sticky action bar |
| `/listings`                       | Server          | Built  | Browse all listings                                           |
| `/listings/[id]`                  | Server          | Built  | Detail with rental info, WhatsApp share                       |
| `/reviews/new/[vendorId]`         | Server + Client | Built  | Star rating + review body form                                |
| `/dashboard`                      | Client          | Built  | Tabbed: Overview, Profile, Portfolio, Reviews                 |
| `/dashboard/listings`             | Client          | Built  | Listing management with delete                                |
| `/dashboard/listings/new/service` | Client          | Built  | Service listing form                                          |
| `/dashboard/listings/new/rental`  | Client          | Built  | Rental listing form                                           |
| `/vendor/signup`                  | Server          | Built  | 4-step wizard                                                 |

### Components (30+)

**Auth:** OtpRequestForm, OtpVerifyForm
**Layout:** Header (sticky), Footer, MobileNav (hamburger overlay), AuthNavLinks (auth-aware)
**Vendor:** VendorCard (search result), ListingCard, PortfolioGallery (lightbox modal), ReviewsList, EnquiryButton (WhatsApp), ShareButton (WhatsApp + copy link + native share), VendorActionBar (sticky bottom mobile), WriteReviewButton (auth-gated)
**Listings:** ServiceListingForm, RentalListingForm
**Reviews:** ReviewForm (star rating + character count)
**Search:** SearchPageClient (filters, debounced fetch, infinite scroll via IntersectionObserver)
**Dashboard:** PortfolioUploader (drag-drop, progress bars, Cloudinary), PortfolioManager (grid + delete dialog), ProfileEditForm (status-aware, resubmit for changes_requested), ReviewsManager (reply + edit with 48h window)
**UI Primitives:** Button (CVA 6 variants), Card, Input, Label, Badge (5 variants), Dialog, DropdownMenu, Select, Progress, Tabs, Textarea, Skeleton (pulse), StarRating (interactive + readonly, 3 sizes)

### What's Working Well

- **Search** has debounced input, URL sync, skeleton loading, infinite scroll, and vendor cards with ratings/prices
- **Vendor profile** has cover image hero, star rating, category/area badges, price range, listings grid, portfolio lightbox, reviews with vendor replies, and a sticky WhatsApp/Share action bar on mobile
- **Portfolio upload** has drag-and-drop, file validation (type + size), progress bars via XHR, and usage counters ("3/10 images")
- **Reviews manager** enforces 48h edit window, shows "Edit window expired" text, and validates reply length
- **Auth flow** has fixed +234 prefix (non-editable), auto-focus, paste support, Web OTP API auto-fill (Android Chrome), "Didn't receive?" helper text, resend countdown, and redirect parameter support
- **Vendor signup** has a 4-step wizard with progress indicator, step validation, visual category tiles (Lucide icons in 2-column grid), and localStorage draft persistence (24h expiry with restore banner)

---

## Bugs & Issues to Fix

### 4. Listing detail lacks auth gate for WhatsApp contact

The vendor profile page correctly gates WhatsApp behind auth (via EnquiryButton), but the listing detail page renders the WhatsApp link for everyone, exposing vendor numbers to unauthenticated visitors.
**Fix:** Use the same `EnquiryButton` component, or add auth-awareness.

### 5. Inconsistent form element styling

- ProfileEditForm and VendorSignupForm use native `<select>` elements with inline Tailwind classes
- SearchPageClient uses Radix `<Select>` components from the UI library
- ServiceListingForm uses native `<select>` with different classes (`border-input bg-background`)
  **Fix:** Standardize on the Radix `<Select>` component from the UI library everywhere, or at minimum use consistent Tailwind classes for native selects.

### 6. Service listing form uses stale Tailwind tokens

**File:** [service-listing-form.tsx](apps/web/src/components/listings/service-listing-form.tsx)
Uses `border-input` and `bg-background` which aren't defined in the Tailwind config (these are shadcn/ui CSS variable tokens that aren't set up). Should use `border-gray-300 bg-white` like the rest of the codebase.

### 7. Footer links are placeholder `#` hrefs

**File:** [footer.tsx](apps/web/src/components/layout/footer.tsx)
About, Contact, and Terms all link to `#`.

---

## Missing Infrastructure

### ~~No error boundaries~~ ✅ PARTIALLY FIXED

Global `error.tsx` added at [app/error.tsx](apps/web/src/app/error.tsx) with a Card UI showing "Something went wrong" message and a "Try Again" retry button.
**Remaining:** Add route-specific `error.tsx` for `app/dashboard/error.tsx` with more contextual error messages.

### No route-level loading states

No `loading.tsx` files exist. Server-rendered pages (listings, vendor profile, search) have no loading UI during navigation.
**Add:** `loading.tsx` with Skeleton-based layouts for `/search`, `/vendors/[slug]`, `/listings`, and `/listings/[id]`. The Skeleton component already exists.

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

### Priority 6 — Listing detail page

**Current state:** Shows listing type badge, category badge, title, description, price range (broken - shows kobo), rental details grid, photo placeholders, and WhatsApp link (broken - no phone number).

**Improvements (after fixing P0 bugs):**

- **Photo carousel:** Replace the 2-column grid of photos with a CSS scroll-snap horizontal carousel. No JS library needed. Add dot indicators.
- **Rental details with icons:** Add visual icons for delivery options (Truck icon for delivery, MapPin for pickup, both for "both"). Show condition as a badge.
- ~~**"View Vendor" link:**~~ ✅ Already added — listing detail now shows "by [vendor name]" linking to the vendor profile.
- **"Similar Listings" section:** Below the main content, show 3-4 listings in the same category. Keeps users on the platform.
- **Breadcrumbs:** "Home > [Category/Type] > [Listing Title]".

### Priority 7 — Performance & polish

- **`loading="lazy"` on all images:** The vendor profile page, portfolio gallery, and search cards don't use lazy loading. Add `loading="lazy"` to all `<img>` tags below the fold.
- **Cloudinary transforms in URLs:** Images should request specific dimensions: append `/c_fill,w_375,h_200,f_auto,q_auto/` to Cloudinary URLs. The portfolio gallery and vendor cards currently use raw URLs.
- **`content-visibility: auto`** on the reviews list and listings grid in vendor profiles. Reduces rendering cost for long pages on low-end devices.
- **`prefers-reduced-motion`:** Disable the skeleton pulse animation and portfolio hover scale for users with reduced motion preference.
- **Route-level loading.tsx:** Add skeleton-based loading states for search, vendor profile, and listing detail pages.

### Priority 8 — Trust signals

- ~~**Verified badge in search results:**~~ ✅ Done in P2 — Green `BadgeCheck` icon shown on VendorCard for ACTIVE vendors.
- **Profile completeness ring:** On vendor cards in search results, show a small circular progress indicator for `profileCompleteScore`. This nudges vendors to complete profiles AND signals completeness to clients.
- ~~**"New on EventTrust" badge:**~~ ✅ Done in P2 — Vendors with `reviewCount === 0` show "New on EventTrust" instead of empty stars.
- ~~**Review count context:**~~ ✅ Done in P2 — Shows "4.8 (23 reviews)" with the word "reviews" for credibility.

---

## Constraints Shaping All Decisions

| Constraint                   | UX Implication                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| 85% Android, 1–3GB RAM       | No heavy animations, virtualize long lists, avoid large component trees                              |
| 2G/3G primary, ≤200KB JS     | Skeleton screens (implemented), progressive image loading (not yet), no client-side search libraries |
| 375px baseline (Tecno Spark) | Single-column layouts, full-width cards (implemented)                                                |
| 44px min touch targets       | Large buttons (mostly implemented), generous spacing (needs audit)                                   |
| WhatsApp as primary channel  | og:image on shareable pages (partially — no dynamic OG images yet)                                   |
| Phone OTP only               | Minimize auth friction (auto-focus, fixed +234 prefix, Web OTP API — all implemented)                |
| Lagos only (22 areas)        | Area selector as a simple list (implemented via Select)                                              |
| No payments (Phase 1–2)      | No cart/checkout complexity (correct)                                                                |
| Sessions interrupted         | Auto-save forms to localStorage (vendor signup implemented, other forms not yet)                     |

---

## Further Considerations

1. **Bottom nav vs tabs for dashboard** — A fixed bottom nav is more discoverable than the current tab bar. Standard in Nigerian apps. Recommended for Phase 2 dashboard redesign.

2. **Dynamic OG images** — WhatsApp is the primary discovery channel. Using `@vercel/og` to generate images with vendor name + rating + cover photo baked in would significantly improve share previews.

3. **Pidgin English copy** — Consider Pidgin for marketing copy: "Find beta vendors for your owambe" feels more local. Keep form labels in standard English.
