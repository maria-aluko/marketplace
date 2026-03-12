# 2 — Constraints

> **Purpose**: Documents hard limits that cannot be changed by the EventTrust Nigeria development team. These constrain design decisions before any code is written.

---

## 2.1 Technical Constraints

| Constraint | Detail | Impact |
|-----------|--------|--------|
| **Android-first** | ~85%+ of Nigerian internet users are on Android. iOS is secondary. | PWA install flow, `<meta>` tags, Chrome-first testing |
| **2G/3G primary network** | MTN, Airtel, Glo networks are unreliable. LTE available in Lagos/Abuja but drops indoors. | Service Worker caching, skeleton UIs, request retries with backoff |
| **Low RAM devices** | Common devices: Tecno Spark, Infinix Hot, Samsung A series (1–3 GB RAM) | Bundle size ≤ 200 KB JS initial, no memory-hungry libraries |
| **Limited local storage** | Users often have <4 GB free storage | IndexedDB quotas, avoid aggressive caching of large payloads |
| **No desktop requirement** | No desktop layout required unless explicitly scoped | Mobile viewport (360–430 px) is design ground truth |
| **Managed infrastructure only** | No self-hosted servers, DBs, or CI runners | Vercel, Supabase, Cloudinary, GitHub Actions |
| **pnpm + Turborepo** | Monorepo tooling is fixed | All packages under one repo, shared `node_modules` |

---

## 2.2 Regulatory & Legal Constraints (Nigeria)

| Regulation | Applies To | Requirement |
|-----------|-----------|------------|
| **NDPR** (Nigeria Data Protection Regulation) | All projects collecting personal data | Privacy policy, data retention limits, right to erasure, lawful basis for processing |
| **FCCPC** Consumer Protection | E-commerce / marketplace projects | Clear T&Cs, refund policies, no deceptive patterns |
| **CBN Guidelines** | Any fintech / payment feature | Cannot hold customer funds; use licensed PSPs (Paystack, Flutterwave) only |
| **NCC Regulations** | OTP/SMS messaging | Must use registered sender IDs; Termii handles this for NG |
| **Content Moderation** | Marketplace / UGC platforms | Must have a mechanism to report and remove illegal content |
| **Age Verification** | Adult content, financial products | Must implement age gate where applicable |

> ⚠️ **NDPR is active law since 2019.** At minimum every project must have: a privacy policy page, a cookie consent if using analytics cookies, and a data processing agreement with any third-party processors.

---

## 2.3 Organisational Constraints

| Constraint | Detail |
|-----------|--------|
| **Small team** | Typically 1–3 engineers. No dedicated DevOps, QA, or security team. |
| **TypeScript everywhere** | No JavaScript-only packages. `strict: true` required. |
| **No custom auth from scratch** | Phone OTP + JWT httpOnly cookies pattern is fixed. Never roll custom session management. |
| **All secrets via environment variables** | No hardcoded keys. `.env.local` for dev, Vercel/Railway env vars for prod. |
| **Shared Zod schemas are source of truth** | Types never manually duplicated between FE and BE. All shared types derive from `@eventtrust/shared`. |
| **Prisma for all DB access** | No raw SQL in application code. Migrations are version-controlled in `apps/api/prisma/migrations/`. |
| **Multi-role constraint** | A phone number maps to one User record. Vendor roles are activated after registration — not separate accounts. |
| **Equipment rental scope** | Vendors who offer rentals must accept liability for equipment condition. Verified via vendor approval process. |
| **No in-platform payment processing (Phase 1–2)** | WhatsApp is the contact channel. Paystack/Flutterwave integration deferred to Phase 3. |
| **Subscription tier limits are application-layer** | Free tier (1 listing, 3 photos) is enforced in `ListingsService` — not a hard DB constraint. |

---

## 2.4 Regional / Market Constraints

### Phone Numbers
- Nigerian numbers follow the format **`+234 XXX XXX XXXX`** (11 digits after country code removed, 10 after stripping leading `0`)
- Phone input must accept: `08012345678`, `+2348012345678`, `2348012345678` — normalise to E.164 (`+234...`) before storage

```typescript
// ✅ DO — normalise to E.164 using a shared utility
// packages/shared/src/utils/phone.ts
export function normaliseNigerianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('234')) return `+${digits}`;
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  throw new Error(`Invalid Nigerian phone number: ${raw}`);
}

// ❌ DON'T — store raw user input or validate with regex only
const phone = req.body.phone; // could be "08012345678" or "+2348012345678"
await db.user.create({ data: { phone } }); // inconsistent storage, breaks lookups
```

### Currency
- **Naira (NGN, ₦)** is the only required currency
- Amounts stored as **integers in kobo** (smallest unit, 1 NGN = 100 kobo) to avoid floating point errors
- Display as `₦1,500.00` — use `Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })`

```typescript
// ✅ DO — store in kobo, format on display
const priceKobo = 150000; // ₦1,500.00
const display = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
}).format(priceKobo / 100); // "₦1,500.00"

// ❌ DON'T — store as float or raw decimal
const price = 1500.50; // floating point errors, ambiguous unit
```

### Date / Time
- **Africa/Lagos timezone** (WAT, UTC+1) must be used for all user-visible timestamps
- Store in UTC in the database; convert to WAT on display

```typescript
// ✅ DO — display in WAT
new Intl.DateTimeFormat('en-NG', {
  timeZone: 'Africa/Lagos',
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(utcTimestamp));

// ❌ DON'T — rely on the server's local timezone
new Date().toLocaleString(); // server may be UTC, US, or any other timezone
```

### Internet Access Patterns
- Sessions are often **short and interrupted** — users may close and reopen tabs
- **Mobile data bundles** expire; users switch between WiFi and data mid-session
- Design all forms with **auto-save / draft state** to IndexedDB to survive interruptions

---

## 2.5 Tooling & Dependency Constraints

| Tool | Constraint |
|------|-----------|
| Node.js | ≥ 20 LTS (required by NestJS 11 and Next.js 15) |
| pnpm | ≥ 9.x (workspace protocol) |
| TypeScript | ≥ 5.x, `strict: true` always enabled |
| Prisma | ≥ 6.x (type-safe client, migrations, `$extends` for soft deletes) |
| Tailwind CSS | ≥ 4.x (v4 config API) |
| shadcn/ui | Components must not be modified at source — extend via variants |
| NestJS | 11.x — class-validator NOT used; Zod schemas via ZodValidationPipe only |
| Next.js | 15.x — App Router only, no Pages Router |

---

## ✅ / ❌ Examples

### ✅ DO — Validate constraints at the schema level

```typescript
// packages/shared/src/schemas/common.ts
import { z } from 'zod';

export const NigerianPhoneSchema = z
  .string()
  .transform(normaliseNigerianPhone) // always store E.164
  .pipe(z.string().regex(/^\+234\d{10}$/, 'Invalid Nigerian phone number'));

export const KoboAmountSchema = z
  .number()
  .int('Amount must be in kobo (integer)')
  .positive();
```

### ❌ DON'T — Let platform assumptions creep into code

```typescript
// ❌ Assumes Stripe is available or appropriate for Nigeria
import Stripe from 'stripe';
const payment = await stripe.paymentIntents.create({ amount, currency: 'usd' });

// ❌ Uses Twilio without considering cost differential
import twilio from 'twilio';
// Twilio Nigeria SMS: ~$0.05/msg vs Termii: ~$0.004/msg
```
