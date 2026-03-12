# 8 — Crosscutting Concepts

> **Purpose**: Documents recurring solution patterns applied consistently across EventTrust Nigeria. These are the "how we always do X" decisions that every developer must follow.

---

## 8.1 Authentication & Session Management

**Pattern**: Phone OTP → short-lived JWT access token + long-lived opaque refresh token + CSRF token, all in cookies.

```
Cookie Name   | httpOnly | TTL    | Notes
--------------|----------|--------|--------------------------------------
access_token  | YES      | 15 min | JWT signed with JWT_SECRET
refresh_token | YES      | 7 days | Opaque, stored as Argon2 hash in DB
csrf_token    | NO       | 7 days | Readable by JS for double-submit CSRF
```

**JWT payload (minimal — never include sensitive data):**
```typescript
interface AccessTokenPayload {
  sub: string;        // userId (UUID)
  role: UserRole;     // CLIENT | VENDOR | ADMIN
  vendorId?: string;  // present if user has a vendor profile
  iat: number;
  exp: number;
}
// ❌ NEVER include: email, phone, password hash, PII
```

**Middleware (Next.js Edge):**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value;
  
  const protectedPaths = ['/dashboard', '/profile', '/listings/new'];
  const isProtected = protectedPaths.some(p => req.nextUrl.pathname.startsWith(p));
  
  if (!isProtected) return NextResponse.next();
  
  if (!token) return NextResponse.redirect(new URL('/login', req.url));
  
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return NextResponse.next();
  } catch {
    // Token expired → client will handle refresh; redirect to avoid loop
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('access_token');
    return response;
  }
}
```

---

## 8.2 Validation — Zod Everywhere

**Rule**: ALL external input (HTTP bodies, query params, env vars, URL params) is validated with Zod before use. No exceptions.

```typescript
// ✅ DO — validate at every entry point

// 1. Next.js API route
export async function POST(req: Request) {
  const body = await req.json();
  const result = CreateListingSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ errors: result.error.flatten() }, { status: 400 });
  }
  // result.data is now fully typed and validated
}

// 2. NestJS with ZodValidationPipe (applied globally in main.ts)
// apps/api/src/common/pipes/zod-validation.pipe.ts
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) throw new BadRequestException(result.error.flatten());
    return result.data;
  }
}

// 3. Environment variables (at startup — fail fast)
const env = EnvSchema.parse(process.env); // in config/env.validation.ts

// ❌ DON'T — trust and use raw input
const { phone, amount } = req.body;
await prisma.payment.create({ data: { phone, amount } }); // unvalidated, type-unsafe
```

---

## 8.3 Error Handling

**Three layers of error handling:**

### Layer 1: API errors (server → client)
All API error responses follow the standard shape (see section 6.6). Use the `GlobalExceptionFilter` in NestJS, or a helper function in Next.js API routes.

### Layer 2: Client-side fetch errors
Handled by the typed API client (`lib/api-client.ts`). TanStack Query surfaces errors as `query.error`.

### Layer 3: React Error Boundaries
Wrap route segments to prevent full-page crashes.

```typescript
// ✅ DO — use Error Boundaries at route level
// app/(app)/listings/error.tsx (Next.js App Router error boundary)
'use client';
export default function ListingsError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-muted-foreground">Something went wrong loading listings.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

// ❌ DON'T — let unhandled errors crash the whole app or show raw error messages
// No error.tsx → user sees Next.js default error page or white screen
```

**Error codes (define in `packages/shared/src/constants`):**
```typescript
export const ErrorCodes = {
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VENDOR_NOT_ACTIVE: 'VENDOR_NOT_ACTIVE',
  LISTING_LIMIT_REACHED: 'LISTING_LIMIT_REACHED',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
} as const;
```

---

## 8.4 Audit Logging Pattern

Every state-changing operation in EventTrust calls `AuditService.log()` before returning. The `admin_log` table is append-only — never update or delete rows.

```typescript
// Every state change logs to admin_log
await this.auditService.log({
  action: 'vendor.status_change',     // namespaced action
  actorId: userId,                    // who performed the action
  targetType: 'Vendor',               // entity type
  targetId: vendorId,                 // entity id
  metadata: { oldStatus, newStatus, reason }, // context
});
```

**Actions logged:**
- `vendor.status_change` — any vendor status transition
- `listing.created`, `listing.updated`, `listing.deleted`
- `review.approved`, `review.removed`
- `dispute.decided`, `dispute.appealed`
- `admin.vendor_approved`, `admin.vendor_suspended`

---

## 8.5 WhatsApp Contact Pattern

WhatsApp is the primary contact channel. The platform never brokers conversations — it builds the deep link and redirects.

```typescript
// apps/web/src/lib/whatsapp.ts
export function buildWhatsAppLink(phone: string, prefilledMessage?: string): string {
  // phone is E.164 from DB: "+2348012345678"
  const digits = phone.replace(/\D/g, '');   // → "2348012345678"
  const text = prefilledMessage
    ? `?text=${encodeURIComponent(prefilledMessage)}`
    : '';
  return `https://wa.me/${digits}${text}`;
}

// Usage in listing detail page
const link = buildWhatsAppLink(
  vendor.phone,
  `Hi, I found your listing on EventTrust: ${listing.title}`
);
```

**Rule:** Client must be logged in to see the WhatsApp contact button. This prevents bot scraping of vendor numbers.

---

## 8.7 Logging & Observability

**Principle**: Log enough to diagnose production issues, but never log PII (phone numbers, names, OTPs).

```typescript
// ✅ DO — structured logging, no PII
logger.info({ event: 'otp.sent', phoneHash: hashForLogging(phone), messageId });
logger.error({ event: 'payment.webhook.invalid_sig', ip: req.ip });

// ❌ DON'T — log raw PII
logger.info(`OTP sent to ${phone}`);  // phone number in logs
logger.debug({ user: { phone, name, email } }); // PII exposure
```

**Tools:**
- **Development**: `console.log` → Next.js / NestJS built-in logger
- **Production**: Sentry (errors + performance) — configured in both `apps/web` and `apps/api`
- **Structured logs**: NestJS `LoggerService` → Railway log aggregation

```typescript
// apps/api/src/main.ts
import * as Sentry from '@sentry/nestjs';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of requests — keep costs low
});
```

---

## 8.8 Performance Budget

These are hard limits enforced in CI via Lighthouse CI or bundle analysis.

| Metric | Limit | How Enforced |
|--------|-------|-------------|
| Initial JS bundle (gzipped) | ≤ 200 KB | `@next/bundle-analyzer` + CI check |
| Largest Contentful Paint (LCP) | ≤ 2.5 s on 3G | Lighthouse CI |
| Time to Interactive (TTI) | ≤ 3.5 s on 3G | Lighthouse CI |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | Lighthouse CI |
| Image: no unoptimised images | 0 raw uploads served | Cloudinary transform required |
| Font: system fonts or WOFF2 subset | Max 1 custom font | font-display: swap |

```typescript
// ✅ DO — dynamic import for non-critical components
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full" />,
});

// ❌ DON'T — import heavy libraries at the top of pages
import { MapComponent } from 'react-leaflet'; // adds ~400 KB to initial bundle
// Use dynamic import for maps, charts, rich text editors
```

---

## 8.9 Mobile-First UI Principles

```typescript
// ✅ DO — mobile-first Tailwind breakpoints (base = mobile)
<div className="flex flex-col gap-2 md:flex-row md:gap-4">
  {/* Mobile: stacked; Desktop: side by side */}
</div>

// ✅ DO — minimum touch target 44×44px (Apple HIG / Material guidelines)
<Button className="min-h-[44px] min-w-[44px] px-4">
  Tap me
</Button>

// ✅ DO — bottom navigation for primary actions (thumb reach)
// Fixed bottom bar on mobile, sidebar on desktop
<nav className="fixed bottom-0 left-0 right-0 md:relative md:flex-col">

// ❌ DON'T — hover-only interactions
<div onMouseEnter={showMenu}>  // invisible on touch devices

// ❌ DON'T — small text or tight spacing
<p className="text-xs leading-none">  // unreadable on low-res screens

// ❌ DON'T — desktop-first breakpoints
<div className="hidden sm:block">  // this hides on mobile — check if intentional
```

---

## 8.10 Data Fetching Patterns

**Server Components (default, prefer):**
```typescript
// ✅ DO — fetch in Server Components for initial page data
// app/(app)/listings/page.tsx
export default async function ListingsPage() {
  const listings = await prisma.listing.findMany({ 
    where: { status: 'ACTIVE' },
    take: 20,
    select: { id: true, title: true, priceKobo: true, imagePublicIds: true }
  });
  return <ListingGrid listings={listings} />;
}
// ↑ No client JS for initial render — faster on 3G
```

**Client Components (for interactivity):**
```typescript
// ✅ DO — use TanStack Query for client-side data that changes
'use client';
function ListingsFilter() {
  const [filters, setFilters] = useState<Filters>({});
  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn: () => fetchListings(filters),
    placeholderData: keepPreviousData, // keep old data while fetching filtered results
  });
}

// ❌ DON'T — fetch in useEffect
useEffect(() => {
  fetch('/api/listings').then(r => r.json()).then(setListings);
}, []); // no caching, no loading states, no error handling, no deduplication
```

---

## 8.11 Database Access Patterns

```typescript
// ✅ DO — always select only needed fields
const listing = await prisma.listing.findUnique({
  where: { id },
  select: {
    id: true, title: true, priceKobo: true,
    owner: { select: { id: true, displayName: true } },
    // ↑ Only fields needed by this view
  },
});

// ✅ DO — use transactions for multi-step operations
await prisma.$transaction(async (tx) => {
  await tx.payment.update({ where: { id }, data: { status: 'SUCCESS' } });
  await tx.listing.update({ where: { id: payment.listingId }, data: { status: 'RENTED' } });
  await tx.notification.create({ data: { userId: ownerId, type: 'PAYMENT_RECEIVED' } });
});

// ❌ DON'T — select all fields or run sequential updates outside transactions
const listing = await prisma.listing.findUnique({ where: { id } });
// listing now includes all fields including sensitive ones

await prisma.payment.update(...);  // if next line fails, data is inconsistent
await prisma.listing.update(...);  // ← partial update: bad state
```

---

## 8.12 Security Checklist

| Concern | Implementation | ❌ Anti-pattern |
|---------|---------------|----------------|
| Secrets | Env vars only, never in code | `const key = "sk_live_xxx"` in source |
| Auth tokens | httpOnly, Secure, SameSite=Lax cookies | `localStorage.setItem('token', jwt)` |
| OTP hashing | Argon2 | MD5, SHA1, or plaintext |
| CSRF | SameSite=Lax cookies + state-changing POST only | GET requests that mutate state |
| Rate limiting | Per-phone for OTP; per-IP for public endpoints | No rate limits on auth endpoints |
| Webhooks | HMAC signature verification | Trusting payload without verification |
| SQL injection | Prisma parameterised queries | `prisma.$queryRaw\`SELECT * WHERE id = ${id}\`` |
| XSS | Next.js escapes by default; avoid `dangerouslySetInnerHTML` | `<div dangerouslySetInnerHTML={{ __html: userContent }}>` |
| Uploads | Signed Cloudinary URLs; never store to local disk | Accepting arbitrary file uploads to server |
| CORS | Explicit `allowedOrigins` in NestJS | `origin: '*'` in production |
