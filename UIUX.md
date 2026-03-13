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
- **Auth flow** has auto-focus, paste support, resend countdown, and redirect parameter support
- **Vendor signup** has a 4-step wizard with progress indicator and step validation

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

### ~~Priority 1 — Home page and discovery~~ ✅ COMPLETED

All P1 items have been implemented:

1. ~~**Category display names**~~ ✅ — Created `CATEGORY_LABELS` map in `@eventtrust/shared` constants. Applied across all category displays: home page, search filters, vendor cards, listing cards, listing detail, vendor profile, vendor signup form.
2. ~~**Category icons**~~ ✅ — Created `CATEGORY_ICONS` map in `apps/web/src/lib/category-meta.tsx` using lucide-react (UtensilsCrossed, Camera, Video, Building, Sparkles, Mic, Music, Palette, CalendarCheck, MoreHorizontal). Displayed as visual tiles on the home page.
3. ~~**Social proof**~~ ✅ — Added "Trusted by vendors across Lagos" line below the subtitle on the home page.
4. ~~**Hero background**~~ ✅ — Added `bg-gradient-to-b from-primary-50 to-white` gradient to the hero section.
5. ~~**Popular vendors section**~~ ✅ — Added "Featured Vendors" section below the category grid. Server-fetches top 6 vendors via `serverFetchRaw<SearchVendorsResponse>('/search/vendors?limit=6')`. Horizontal scroll with snap on mobile, grid on desktop. "View all →" link to search page. Home page converted from client to server component (search bar extracted to `HeroSearch` client component).

### ~~Priority 2 — Search page refinements~~ ✅ COMPLETED

All P2 items have been implemented:

1. ~~**Active filter indicators**~~ ✅ — Active filters now display as colored chips (`bg-primary-100`) below the filter bar with an `×` (lucide `X` icon) to clear each one individually. A "Clear all" link resets all filters at once.
2. ~~**Empty state improvement**~~ ✅ — When no vendors match, the empty state now shows specific suggestions based on which filters are active: "Remove [category] filter", "Search in all areas", "Include unverified vendors", and "Clear all filters" — each as a clickable button that resets that filter.
3. ~~**Result count position**~~ ✅ — "X vendors found" moved from between filters and results into the results header, displayed as `font-medium text-gray-700` directly above the vendor grid. Loading state shows a skeleton placeholder for the count.
4. ~~**Vendor card enhancements**~~ ✅ — Added a green `BadgeCheck` icon (lucide) next to the business name for vendors with `status === 'active'`. Review display improved: shows "4.8 (23 reviews)" with the word "reviews" for trust. Vendors with zero reviews show "New on EventTrust" instead of empty stars.

### ~~Priority 3 — Vendor profile page~~ ✅ COMPLETED

**Current state:** Well-structured with hero image, trust signals (verified badge, star rating, review count), category/area badges, price range, about section, listings grid, portfolio gallery with lightbox, reviews with replies, and sticky mobile action bar.

All P3 items have been implemented:

1. ~~**"Member since" date**~~ ✅ — Added `Joined {month} {year}` near the trust signals using `vendor.createdAt` with a `CalendarDays` icon. Formatted via `toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })`.
2. ~~**Cover image fallback**~~ ✅ — When no `coverImageUrl` exists, renders a `CoverImageFallback` component showing a branded gradient (`from-primary-100 via-primary-50 to-white`) with the category icon centered (via `CATEGORY_ICONS` map).
3. ~~**Tab navigation for sections**~~ ✅ — Replaced long-scroll layout with Radix `Tabs` component (`VendorProfileTabs` client component). Four tabs: About, Listings (count), Portfolio (count), Reviews (count). Tab bar sticks below the header on scroll. Empty states shown for tabs with no content.
4. ~~**WhatsApp pre-fill message improvement**~~ ✅ — `EnquiryButton` now accepts optional `listingName` prop. When present, message reads: `I'm interested in "[listing title]"` instead of generic `"your services"`. Listing detail page passes listing title as `?listing=` query parameter when linking to vendor profile. `VendorActionBar` passes it through.
5. ~~**Breadcrumbs**~~ ✅ — Added `Home > [Category] > [Business Name]` breadcrumb navigation with `ChevronRight` separators. Category links to `/search?category=...` for easy exploration. Accessible via `aria-label="Breadcrumb"`.

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

### Priority 5 — Auth & onboarding

**Current state:** Phone input starts with "+234" pre-filled. OTP input has individual digit boxes with auto-focus, paste support, and resend countdown. Vendor signup is a 4-step wizard.

**Improvements:**

- **Phone input with fixed prefix:** Lock the "+234" as a non-editable prefix (display in a gray label beside the input). User only types the 10 digits. This prevents accidental deletion of the country code.
- **Web OTP API:** On Android Chrome, use `navigator.credentials.get({ otp: { transport: ['sms'] } })` to auto-fill the OTP from Termii's SMS. Requires the SMS to end with `@eventtrust.com.ng #123456` format. Major friction reduction.
- **"Didn't receive?" helper text:** After the countdown expires, show "Didn't receive the code? Check your SMS inbox" before the "Resend" button.
- **Vendor signup - category visual tiles:** Replace the dropdown with visual category cards (icon + label) in a 2-column grid. More scannable on mobile.
- **Vendor signup - draft persistence:** Save wizard state to `localStorage` on each step. If the session drops (common on 2G/3G), restore on return. Check for stale data by timestamp.

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
| Phone OTP only               | Minimize auth friction (auto-focus implemented, Web OTP API not yet)                                 |
| Lagos only (22 areas)        | Area selector as a simple list (implemented via Select)                                              |
| No payments (Phase 1–2)      | No cart/checkout complexity (correct)                                                                |
| Sessions interrupted         | Auto-save forms to localStorage/IndexedDB (not implemented)                                          |

---

## Further Considerations

1. **Bottom nav vs tabs for dashboard** — A fixed bottom nav is more discoverable than the current tab bar. Standard in Nigerian apps. Recommended for Phase 2 dashboard redesign.

2. **Dynamic OG images** — WhatsApp is the primary discovery channel. Using `@vercel/og` to generate images with vendor name + rating + cover photo baked in would significantly improve share previews.

3. **Pidgin English copy** — Consider Pidgin for marketing copy: "Find beta vendors for your owambe" feels more local. Keep form labels in standard English.
