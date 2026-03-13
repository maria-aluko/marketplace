# UI/UX Research & Ideas — EventTrust Nigeria

## Constraints That Shape Every UI Decision

Constraint UX Implication
85% Android, 1–3GB RAM devices No heavy animations, virtualize long lists, avoid large component trees
2G/3G primary, ≤200KB JS bundle Skeleton screens instead of spinners, progressive image loading, no client-side search libraries
375px baseline (Tecno Spark) Single-column layouts, full-width cards, no side-by-side panels on mobile
44px minimum touch targets Large buttons, generous spacing between tappable elements
WhatsApp as primary discovery channel og:image, og:title, og:description on every shareable page
Phone OTP only, no social login Minimize auth friction — OTP flow must feel fast
Lagos only (22 areas) Area selector can be a simple list, not a map
No payments (Phase 1–2) No cart, checkout, or pricing complexity — focus on lead generation
Sessions interrupted (WiFi/data switching) Auto-save form drafts to IndexedDB

## UI/UX Ideas by Area

1. Home Page & Discovery
   Current: Hero section with vendor category cards. Functional but generic.

Ideas:

- Category-first navigation — Large, icon-based category tiles (like Gojek/Grab) instead of text links. Each category gets a distinct icon and color. This is the primary browse path for low-literacy or quick-scan users.
- "Popular in [Area]" section — Use the LAGOS_AREAS constant to personalize. If the user's area is known (from profile or previous search), show relevant vendors first. Otherwise show top-rated vendors across Lagos.
- Social proof banner — "200+ verified vendors in Lagos" counter. Even small numbers feel credible if displayed confidently.
- Recent searches / Recently viewed — Stored in localStorage (lightweight). Returning users skip the category grid and jump straight to what they were browsing.
- Sticky search bar at top — Always visible. Since search is a core action, it shouldn't be buried. A single input with category pills below it.

2. Search & Filtering
   Current: Backend search endpoint exists with ranked scoring and cursor pagination. No frontend search UI exists yet.

Ideas:

- Filter chips (not a sidebar) — Mobile-first means filters as horizontally scrollable chips above results: Category, Area, "Verified Only" toggle. No dropdown menus — tapping a chip opens a bottom sheet.
- Bottom sheet for filter details — When tapping "Area" chip, a bottom sheet slides up with the 22 Lagos areas as a scrollable list with checkboxes. This pattern works well on 375px screens and is familiar from apps like Jumia.
- Result cards: information density — Each vendor card should show: business name, category badge, area, star rating + review count, price range, and a small thumbnail. No more than 5 lines. Tap to expand.
- Skeleton loading — On 3G, the search results page needs skeleton cards (gray pulsing rectangles) not a spinner. The backend returns results in ~500ms p95, but network latency adds 1–2s on 3G.
- "No results" state with suggestions — If no vendors match, suggest: broadening area, removing category filter, or browsing all vendors. Don't show an empty page.
- Infinite scroll with cursor pagination — The backend already supports cursor pagination (nextCursor). Use Intersection Observer to trigger the next page load. Show a small loading indicator at the bottom, not a "Load More" button (reduces taps).

3. Vendor Public Profile (/vendor/[slug])
   Current: Route referenced in docs/building blocks but not yet implemented in the frontend.

Ideas:

- Hero section with cover image — Use coverImageUrl from Vendor model. If absent, show a branded placeholder with the category icon. Full-width, 200px height.
- Sticky action bar — Fixed at the bottom of the screen: "Contact on WhatsApp" (green, primary) and "Share" button. These are the two most important actions and should never scroll off screen.
- Trust section prominently placed — Verified badge, star rating, review count, "Member since [date]" — all above the fold. Nigerian marketplace trust requires these signals to be immediately visible.
- Tabbed content — Below the hero: "Services" | "Rentals" | "Portfolio" | "Reviews" tabs. Each tab lazy-loads its content. This keeps the page lightweight and the URL clean.
- Listing cards within vendor profile — Group service listings and rental listings under their respective tabs. Each card shows title, price, and a thumbnail. Tap to see full listing detail.
- WhatsApp-optimized sharing — generateMetadata() should produce a compelling og:image (vendor name + rating + category + cover photo). When shared on WhatsApp, this card is the first impression. Consider generating a dynamic OG image using @vercel/og with the vendor's data baked in.
- Price range display — Format with Intl.NumberFormat('en-NG') as "₦50,000 – ₦200,000". Prices stored in kobo, displayed in naira.

4. Listing Detail Page
   Current: Basic SSR page showing listing data, rental details, and WhatsApp share button.

Ideas:

- Photo carousel — Up to 10 photos per listing. Use a lightweight swipeable carousel (CSS scroll-snap, no JS library needed to stay under 200KB). Show dot indicators below.
- For rental listings: Prominent display of quantityAvailable, depositAmount, deliveryOption (with icons: truck for delivery, pin for pickup), and condition. These are decision-making fields.
- "Similar Listings" section — Below the main content. Query by same category + area. Keeps users on the platform instead of bouncing.
- Breadcrumb navigation — "Home > Catering > [Listing Title]" — helps orientation. Especially useful when users land from WhatsApp shares.

5. Vendor Dashboard
   Current: Basic client component showing user profile, vendor status, and link to manage listings.

Ideas:

- Status-aware dashboard — The dashboard should look different based on vendor status:
  - DRAFT: Prominent "Complete Your Profile" checklist with progress bar (uses profileCompleteScore). Each incomplete field is a tappable card that opens the edit form for that section.
  - PENDING: "Your profile is under review" with estimated time. Maybe a simple timeline graphic.
  - ACTIVE: Full dashboard with metrics, listings, and quick actions.
  - CHANGES_REQUESTED: Show admin feedback prominently with "Fix & Resubmit" button.
  - SUSPENDED: Clear explanation + contact support CTA.

- Quick stats cards — For active vendors: Total views (future), Total inquiries (future), Average rating, Number of reviews. Even if some metrics are 0, showing the cards sets expectations.
- Listing management — Grid of listing cards with status badges. "Add New Listing" as a prominent FAB (Floating Action Button) or top action bar button.
- Profile completeness nudge — A persistent banner: "Your profile is 67% complete. Complete your address and WhatsApp to get more leads." Links directly to the incomplete fields.
- Bottom navigation bar — For the dashboard section: Home | Listings | Portfolio | Reviews | Profile. This is more mobile-native than the current hamburger menu for the vendor's workspace.

6. Auth & Onboarding
   Current: OTP request form → OTP verify form with auto-focus and paste support. 4-step vendor signup wizard.

Ideas:

- Phone input with country prefix locked to +234 — Show the flag 🇳🇬 and +234 prefix as non-editable, user only types the 10 digits. Avoids E.164 formatting confusion. The phoneSchema handles validation.
- OTP auto-read (Android) — Use the Web OTP API (navigator.credentials.get({ otp: { transport: ['sms'] } })). On Android Chrome, the OTP from Termii can auto-fill the input if the SMS contains the right format. This dramatically reduces friction.
- Countdown timer with "Resend" disabled state — Already implemented. Good. Consider adding "Didn't receive? Check your SMS inbox" helper text instead of just a countdown.
- Vendor signup wizard improvements:
  - Progress indicator — Show step 2/4 with a thin progress bar. Already partially implemented.
  - Save draft between steps — Use IndexedDB to persist form data. If the user's session drops (common on 2G/3G), they don't lose progress.
  - Category selection as visual cards — Instead of a dropdown for VendorCategory, show icon cards (photographer icon, catering icon, etc.). More scannable on mobile.
  - Area selector as a searchable list — 22 areas is manageable but benefit from type-ahead filtering.

7. Reviews
   Current: Backend CRUD complete (create, approve, reject, reply, score recalculation). No frontend UI.

Ideas:

- Review display on vendor profile — Star rating + review count at top, individual review cards below. Each card: client name (anonymized?), star rating, date, review text, vendor reply (if exists, indented).
- "Write a Review" CTA — Only shown to authenticated clients. Button on vendor profile leads to a dedicated form page. Show the 50-char minimum as a character count ("12/50 characters minimum").
- Review form UX — Star rating selector (5 tappable stars, large 48px each). Text area with character counter. Clear "Submit Review" button. Success state: "Your review is pending approval."
- Vendor reply UI — On the dashboard, unread reviews should show as notifications/badges. Reply form inline on the review card with a 1000-char limit and "48h to edit" reminder.

8. - Portfolio Upload
     Current: Backend complete (Cloudinary signed URL, confirm upload, 10 image / 2 video limits). No frontend UI.

Ideas:

- Drag-and-drop on desktop, tap-to-upload on mobile — Use <input type="file" accept="image/*,video/*"> with a visually rich dropzone. Show upload progress bars (Cloudinary supports progress events).
- Photo grid with reorder — After upload, show photos in a grid. Use long-press (mobile) or drag (desktop) to reorder (sortOrder field). This is important for vendors who want their best photos first.
- Upload limits clearly shown — "3/10 photos uploaded" counter. When approaching limits, show a warning. At limit, disable the upload button with explanation.
- Image optimization reminder — Since Cloudinary handles f_auto,q_auto, no client-side optimization needed. But show thumbnails during upload so vendors see their images instantly.
- Video thumbnail — For video uploads, show a still frame as thumbnail. Keep video count prominent ("0/2 videos").

9. WhatsApp Integration
   Current: WhatsApp number stored on vendor. Backend exposes it only to authenticated users. Share button exists on listing detail.

Ideas:

- "Contact on WhatsApp" button — Green button with WhatsApp icon, always visible (sticky bottom bar on vendor/listing pages). Pre-fill message: "Hi, I found you on EventTrust. I'm interested in your [listing title] for my event on [date]."
- Login gate with context — If unauthenticated user taps "Contact on WhatsApp", show: "Sign in to contact this vendor" with OTP flow. After auth, immediately open WhatsApp link. Use the ?redirect parameter already supported in middleware.
- Share button — "Share on WhatsApp" uses wa.me/?text=Check out [vendor name] on EventTrust: [URL]. The URL must have proper OG tags so the WhatsApp preview card shows vendor photo, name, rating.
- Copy phone number — Some users prefer to call. Add a "Copy Number" secondary action (only for authenticated users).

10. PWA & Offline Patterns
    Current: Referenced in docs but not yet implemented (service worker, manifest).

Ideas:

- Install prompt — After 2nd visit, show a custom "Add to Home Screen" banner. Many Nigerian users treat PWAs as apps. This increases retention dramatically.
- Offline vendor profiles — Cache previously viewed vendor profiles via service worker (Cache-First). When offline, show cached data with "You're offline, showing saved data" banner.
- Offline form drafts — Vendor signup and listing forms save to IndexedDB on every field change. On reconnect, prompt to continue.
- Network status indicator — A thin colored bar at the top: green (online), yellow (slow connection), red (offline). Builds trust — users know the app is aware of their connection.

11. Trust Signals
    Current: profileCompleteScore calculated, avgRating and reviewCount stored, vendor status machine exists. No frontend trust UI.

Ideas:

- Verified badge — A ✓ checkmark next to the business name for ACTIVE vendors. This is the minimum. Consider different badge tiers tied to subscription (Pro gets a blue badge, Pro+ gets gold).
- "Profile Completeness" as a public signal — Show a progress ring on vendor cards (80% complete). This nudges vendors to complete profiles AND gives clients a quick trust signal.
- "Joined [Month Year]" — Longevity signals trust. Show "Member since March 2026" on vendor profiles.
- Review count with context — "4.8 ★ (23 reviews)" is more trustworthy than just "4.8 ★". For new vendors: "New on EventTrust" badge instead of empty stars.
- Response time indicator (future) — "Usually responds within 2 hours" based on WhatsApp interaction tracking (Phase 2+).

12. Performance Patterns for Low-End Devices

- loading="lazy" on all images below the fold — Native browser lazy loading, zero JS cost.
- CSS scroll-snap for carousels — No Swiper.js or similar. Pure CSS carousels work on Android Chrome and are zero-JS.
- content-visibility: auto on long lists — Tells the browser to skip rendering off-screen content. Free performance win.
- System font stack — Already using system fonts. Good. Avoid loading Google Fonts.
- Reduced motion — Respect prefers-reduced-motion for users on battery saver mode (common on low-end Android).
- Image sizing with Cloudinary transforms — Request exact dimensions: c_fill,w_375,h_200,f_auto,q_auto. No client-side resizing.

## Further Considerations

- Bottom navigation vs. hamburger menu — For the vendor dashboard, a fixed bottom nav (Home/Listings/Portfolio/Reviews/Profile) is significantly more discoverable than a hamburger menu. This is standard in Nigerian apps (Opay, PalmPay, Kuda). Recommended for the dashboard section; keep the hamburger for the public-facing site.

- Dark mode — Not a priority given the target demographic, but the green primary palette works well in both modes. Defer to Phase 3.

- Localization — The product is English-only, which is correct for Lagos. However, consider Pidgin English for marketing copy and onboarding tooltips ("Find beta vendors for your owambe") to feel more local and approachable.
