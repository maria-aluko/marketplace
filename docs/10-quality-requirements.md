# 10 — Quality Requirements

> **Purpose**: Makes EventTrust Nigeria's quality goals concrete and testable via scenarios and a quality tree.

---

## 10.1 Quality Tree

```
Quality
├── Performance
│   ├── Initial load on 3G ≤ 3 s (LCP)
│   ├── Time to Interactive ≤ 3.5 s on 3G
│   ├── JS bundle initial ≤ 200 KB gzipped
│   └── Image: WebP/AVIF via Cloudinary, lazy-loaded
│
├── Reliability / Offline Resilience
│   ├── Read flows function with stale cache offline
│   ├── Write forms persist drafts to IndexedDB
│   ├── OTP delivery: Termii SLA-backed
│   └── Graceful degradation: no white screens
│
├── Security
│   ├── Tokens in httpOnly cookies (no XSS token theft)
│   ├── OTPs hashed with Argon2 (one-time use, 10 min TTL)
│   ├── All secrets server-side only
│   ├── Payment verified via server-side webhook only
│   └── Rate limiting on auth endpoints
│
├── Maintainability
│   ├── Types flow from Zod schemas (no drift)
│   ├── Modules independently testable
│   ├── Migrations version-controlled (Prisma)
│   └── Consistent error response shape
│
├── Usability (Mobile-First)
│   ├── Viewport: 360 px baseline
│   ├── Touch targets: ≥ 44 × 44 px
│   ├── Offline feedback: always shown
│   └── Form auto-save on connection loss
│
└── Data Efficiency
    ├── No raw image serving (always transformed)
    ├── API responses paginated (default: 20 items)
    ├── GraphQL not used (over-fetching prevention via Prisma select)
    └── Service Worker caches static assets
```

---

## 10.2 Quality Scenarios

### QS-01: Page Load on 3G (Performance)

| Attribute | Value |
|-----------|-------|
| **Source** | End user on MTN 3G, low-end Android (Tecno Spark) |
| **Stimulus** | User navigates to listings page for the first time |
| **Environment** | 3G network (~1 Mbps), cold cache |
| **Response** | Page renders meaningful content |
| **Measure** | LCP ≤ 2.5 s, TTI ≤ 3.5 s, JS ≤ 200 KB gzipped |
| **How Tested** | Lighthouse CI on simulated 3G (4× throttling) in GitHub Actions |

**Implementation checklist:**
- [ ] SSR or ISR for the route (no client-side data waterfall on first load)
- [ ] Images served via Cloudinary with `w_400,f_auto,q_auto` on mobile
- [ ] `next/font` with `display: 'swap'`
- [ ] No synchronous third-party scripts
- [ ] Dynamic import for heavy components (maps, editors)

---

### QS-02: Offline Read — Vendor Profile (Reliability)

| Attribute | Value |
|-----------|-------|
| **Source** | User who previously visited a vendor profile page |
| **Stimulus** | Opens app with no connectivity |
| **Environment** | Airplane mode / network dropped |
| **Response** | Vendor profile renders from service worker cache with "You're offline" banner |
| **Measure** | Content renders within 1 s from cache; no error screen shown |
| **How Tested** | Playwright: load vendor profile, set `offline: true`, navigate back, assert content visible |

```typescript
// Playwright test
test('shows cached vendor profile when offline', async ({ page, context }) => {
  await page.goto('/vendor/test-vendor-slug');
  await page.waitForSelector('[data-testid="vendor-profile"]');

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
  await expect(page.locator('[data-testid="vendor-profile"]')).toBeVisible();
  // Must show content, not error screen
});
```

---

### QS-03: OTP Delivery (Reliability)

| Attribute | Value |
|-----------|-------|
| **Source** | User attempting to log in |
| **Stimulus** | Submits phone number |
| **Environment** | Production; MTN/Airtel/Glo network |
| **Response** | OTP SMS received |
| **Measure** | ≥ 97% delivery within 60 seconds; rate limit hit returns 429 clearly |
| **How Tested** | Monitor Termii delivery reports; alert if delivery rate < 97% |

---

### QS-04: JWT Compromise Blast Radius (Security)

| Attribute | Value |
|-----------|-------|
| **Source** | Attacker who obtains an access token |
| **Stimulus** | Attempts to use stolen access token |
| **Environment** | Production |
| **Response** | Token is usable only until its 15-minute TTL expires |
| **Measure** | Maximum exposure window: 15 minutes |
| **How Tested** | Unit test: verify token expires; integration test: expired token returns 401 |

---

### QS-05: Data Breach — OTP Exposure (Security)

| Attribute | Value |
|-----------|-------|
| **Source** | Attacker with read access to Redis |
| **Stimulus** | Reads OTP storage |
| **Environment** | Compromised Redis instance |
| **Response** | Attacker cannot derive the OTP from the stored value |
| **Measure** | Stored value is Argon2 hash; brute-force of 6-digit OTP requires ~100ms/attempt × 1M attempts |
| **How Tested** | Code review: verify `argon2.hash()` used on all OTP stores |

---

### QS-06: Search Performance (Performance)

| Attribute | Value |
|-----------|-------|
| **Source** | Client searching for vendors/listings |
| **Stimulus** | Search request with filters (category, area, listingType) |
| **Environment** | Production, 1,000 active listings in DB |
| **Response** | Ranked search results returned |
| **Measure** | Search API response ≤ 500 ms (p95) |
| **How Tested** | k6 load test against `/search` endpoint with realistic filter combinations |

---

### QS-07: WhatsApp og:image Preview (Usability)

| Attribute | Value |
|-----------|-------|
| **Source** | Vendor or client sharing a vendor profile link in WhatsApp |
| **Stimulus** | Link shared in WhatsApp chat |
| **Environment** | Production; WhatsApp link preview crawler |
| **Response** | WhatsApp shows rich preview: vendor name, description, profile photo |
| **Measure** | og:image, og:title, og:description all present and correct in SSR HTML |
| **How Tested** | Playwright: fetch vendor profile page, assert meta tags present in HTML response |

```typescript
test('vendor profile has correct og tags for WhatsApp sharing', async ({ page }) => {
  const response = await page.goto('/vendor/test-vendor-slug');
  const html = await response!.text();

  expect(html).toContain('property="og:title"');
  expect(html).toContain('property="og:description"');
  expect(html).toContain('property="og:image"');
});
```

---

## 10.3 Performance Budget (Enforced in CI)

```json
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/listings'],
      settings: { throttlingMethod: 'simulate', throttling: { rttMs: 150, throughputKbps: 1638 } }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-byte-weight': ['error', { maxNumericValue: 500000 }]
      }
    }
  }
};
```

---

## ✅ / ❌ Quality Practice Examples

### ✅ DO — Write testable quality requirements

```markdown
QS-01: The listings page must reach LCP ≤ 2.5 s when measured by Lighthouse
on a simulated 3G connection (1.5 Mbps, 150 ms RTT). Verified in CI on every PR.
```

### ❌ DON'T — Write vague quality statements

```markdown
"The app should be fast and responsive."  
← Not measurable. Cannot be tested. Cannot fail.
```
