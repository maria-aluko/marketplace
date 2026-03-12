# 11 — Risks & Technical Debt

> **Purpose**: Documents known problems, risks, and accepted shortcuts. Prevents surprises and guides prioritisation.

---

## 11.1 Risk Register

### RISK-01: Termii Service Disruption

| Attribute | Value |
|-----------|-------|
| **Risk** | Termii is unavailable or has degraded delivery rates |
| **Probability** | Low–Medium (smaller provider, less redundancy than Twilio) |
| **Impact** | High — users cannot authenticate; all auth flows blocked |
| **Mitigation** | Implement `ISmsProvider` interface so provider is swappable (see section 3.2.2). Designate Africa's Talking as fallback with feature flag. Monitor Termii delivery rates via webhook receipts. |
| **Trigger to act** | Delivery rate < 97% over 1-hour window, or Termii status page shows incident |

```typescript
// ✅ Mitigation implemented: swappable provider
// Set FEATURE_SMS_PROVIDER=africas_talking in env to switch
const smsProvider = process.env.FEATURE_SMS_PROVIDER === 'africas_talking'
  ? new AfricasTalkingAdapter()
  : new TermiiAdapter();
```

---

### RISK-02: Supabase Free Tier Limits

| Attribute | Value |
|-----------|-------|
| **Risk** | Project started on Supabase Free tier; hits row limits or pauses after 1 week of inactivity |
| **Probability** | High for MVP/early-stage projects |
| **Impact** | Medium — DB pauses; app unavailable until manual resume |
| **Mitigation** | Upgrade to Supabase Pro ($25/mo) before production launch. Free tier acceptable for development only. Add infra cost line to project budget. |

> ⚠️ **Supabase Free tier pauses after 1 week of inactivity.** Never use Free tier in production.

---

### RISK-03: Vercel Serverless Function Cold Starts

| Attribute | Value |
|-----------|-------|
| **Risk** | Next.js API routes on Vercel have cold starts of 500ms–2s after inactivity |
| **Probability** | Medium (especially auth routes called infrequently in early stages) |
| **Impact** | Medium — slow auth experience; users may think app is broken |
| **Mitigation** | Keep API route handlers lightweight (no heavy imports). Use Vercel's Edge runtime for auth middleware (already done). Consider Railway for NestJS to avoid serverless cold starts. |

---

### RISK-04: Cloudinary Cost Escalation

| Attribute | Value |
|-----------|-------|
| **Risk** | High image upload volume drives Cloudinary costs above budget |
| **Probability** | Low in early stage; Medium at scale |
| **Impact** | Medium — unexpected spend |
| **Mitigation** | Set Cloudinary upload limits per user (max 10 images/listing). Add `max_bytes` restriction on signed upload params. Monitor Cloudinary usage dashboard monthly. |

```typescript
// ✅ Enforce upload limits on signed URL generation
const signature = cloudinary.utils.api_sign_request({
  timestamp,
  folder,
  max_bytes: 5_000_000,  // 5 MB max per file
  allowed_formats: 'jpg,jpeg,png,webp',
}, process.env.CLOUDINARY_API_SECRET!);
```

---

### RISK-05: No In-Platform Payment Processing (Phase 1–2)

| Attribute | Value |
|-----------|-------|
| **Risk** | Vendors negotiate payments via WhatsApp with no platform protection — fraud/disputes without escrow |
| **Probability** | Medium (offline payment disputes are common in Nigerian marketplaces) |
| **Impact** | Medium — platform trust risk; not a technical risk |
| **Mitigation** | Vendor verification process, review system, and dispute workflow (Phase 3) reduce fraud risk. Payment processing (escrow, deposits) introduced in Phase 3. |

---

### RISK-08: Vendor Adoption Drop-off

| Attribute | Value |
|-----------|-------|
| **Risk** | Vendors sign up but don't complete their profile or add listings |
| **Probability** | High — onboarding drop-off is common in marketplace cold-start phase |
| **Impact** | High — empty marketplace; no supply for clients to discover |
| **Mitigation** | Manual onboarding (personal outreach), WhatsApp support, signup target <10 minutes. Profile completeness score visible in dashboard motivates completion. |

---

### RISK-09: Equipment Rental Trust and Liability

| Attribute | Value |
|-----------|-------|
| **Risk** | Vendor delivers damaged or substandard rental equipment; no platform protection for client |
| **Probability** | Medium (disputes about equipment condition are common) |
| **Impact** | Medium — reputational damage to platform |
| **Mitigation** | Vendor verification, review system with equipment-specific ratings, dispute workflow (Phase 3). Future: deposit escrow to incentivise good condition. |

---

### RISK-06: Single Developer Bottleneck

| Attribute | Value |
|-----------|-------|
| **Risk** | Most projects use 1–2 engineers; bus factor is 1 |
| **Probability** | High (small team is a constraint) |
| **Impact** | High — knowledge concentration; slow incident response |
| **Mitigation** | Architecture documentation (this template) reduces onboarding time. Managed infra (Vercel, Supabase, Railway) reduces operational burden. No custom infrastructure to manage. |

---

### RISK-07: NDPR Non-Compliance

| Attribute | Value |
|-----------|-------|
| **Risk** | Collecting personal data without NDPR-compliant privacy policy, consent, or data processing agreement |
| **Probability** | Medium (easy to overlook during MVP rush) |
| **Impact** | High — regulatory fine, reputational damage |
| **Mitigation** | Checklist: privacy policy page, cookie consent (if analytics), data retention policy, DPA with Supabase/Cloudinary/Termii. Legal review before launch if collecting sensitive data. |

---

## 11.2 Technical Debt Register

### DEBT-01: No Automated E2E Tests at MVP

| Attribute | Value |
|-----------|-------|
| **Debt** | Playwright E2E tests are defined in quality scenarios but not yet implemented at MVP |
| **Accepted Because** | Speed to market; small team |
| **Impact** | Regressions in auth and payment flows not caught automatically |
| **Payoff Plan** | Add 5 critical Playwright tests before first paid user: auth flow, listing creation, payment webhook |
| **Deadline** | Before launch |

---

### DEBT-02: No Rate Limiting on Public API Routes (MVP)

| Attribute | Value |
|-----------|-------|
| **Debt** | Rate limiting on public read endpoints (listing search, detail) not implemented at MVP |
| **Accepted Because** | Low initial traffic; scraping risk is low initially |
| **Impact** | Vulnerability to scraping; unexpected DB load at scale |
| **Payoff Plan** | Add Vercel Edge rate limiting middleware using Upstash Redis |
| **Deadline** | Before scaling / public launch |

---

### DEBT-03: No Push Notifications (PWA)

| Attribute | Value |
|-----------|-------|
| **Debt** | PWA manifest includes push notification capability but not implemented |
| **Accepted Because** | Requires backend subscription storage, notification queue — complexity out of scope for MVP |
| **Impact** | Reduced re-engagement for app-like projects |
| **Payoff Plan** | Implement Web Push with Supabase Realtime or a queue (BullMQ on NestJS) post-launch |
| **Deadline** | Version 2.0 |

---

### DEBT-05: ListingsModule Not Yet Built (Post Phase 1)

| Attribute | Value |
|-----------|-------|
| **Debt** | `ListingsModule`, `Listing` Prisma model, and `ListingRentalDetails` model are planned but not implemented at end of Phase 1 |
| **Accepted Because** | Phase 1 focuses on auth + vendor foundation; listings are Phase 2 scope |
| **Impact** | Vendors cannot create service or rental listings until Phase 2 completes |
| **Payoff Plan** | Implement in Phase 2 Track A (see IMPLEMENTATION_PLAN.md) |
| **Deadline** | Phase 2 |

---

### DEBT-04: Single Supabase Region

| Attribute | Value |
|-----------|-------|
| **Debt** | Database deployed in `eu-west-1` (Ireland) — ~50–80 ms latency to Lagos |
| **Accepted Because** | Supabase does not have a West Africa region yet |
| **Impact** | 50–80 ms added to every DB query; acceptable for current scale |
| **Payoff Plan** | Monitor Supabase region expansion. Migrate to Lagos/SA region when available. Consider read replicas if latency becomes user-facing issue. |

---

## 11.3 What NOT to Build (Scope Guard)

These are explicitly out of scope for EventTrust Phase 1–2. Each requires a new ADR before implementation:

| Request | Why Out of Scope |
|---------|-----------------|
| Payment processing (Paystack/Flutterwave) | Phase 3 — WhatsApp is the Phase 1–2 contact channel |
| Equipment delivery logistics | Separate product domain — future logistics partner integration |
| Social auth (Google/Facebook OAuth) | Phone-first covers Nigerian users; OAuth is Phase 3+ |
| CRM, invoicing, booking calendar | Phase 3 vendor business tools |
| Subscription billing / Stripe | Phase 3 — tier schema ready from Phase 2 |
| Self-hosted database | Increases ops burden unacceptably |
| Multi-currency support | NGN only; kobo stored as integer |
| WhatsApp as OTP channel | Requires Meta Business API approval; Termii preferred |
| Real-time features (WebSockets, live chat) | Lead marketplace model doesn't require real-time |
| Mobile app (iOS/Android native) | PWA covers Android; native is future scope |

---

## 11.4 Monitoring & Alerting (Minimum Viable)

Before launch, configure:

```
[ ] Sentry: error tracking for apps/web + apps/api
[ ] Vercel Analytics: Core Web Vitals monitoring
[ ] Supabase: DB usage alerts (connections, storage)
[ ] Termii: Delivery rate monitoring (via webhook receipts)
[ ] Uptime: UptimeRobot or BetterStack — ping /health every 5 minutes
```

Alert thresholds:
- Error rate > 1% over 5-minute window → Sentry alert
- p95 response time > 1 s → Vercel analytics alert
- Termii delivery rate < 97% → Custom alert from delivery webhook logs
- DB connections > 80% of pool → Supabase alert
