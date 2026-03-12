# 7 — Deployment View

> **Purpose**: Describes EventTrust Nigeria's infrastructure, hosting, and deployment pipeline. Shows how software maps to infrastructure.

---

## 7.1 Infrastructure Overview

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION                           │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │   Vercel     │    │         Supabase             │  │
│  │              │    │                              │  │
│  │ apps/web     │    │  Postgres (Pooled + Direct)  │  │
│  │ Next.js 15   │    │  Auth (optional)             │  │
│  │ Edge Middleware    │  Storage (not used — CDN)   │  │
│  │ ISR / SSR    │    │  Realtime (if needed)        │  │
│  └──────┬───────┘    └──────────────────────────────┘  │
│         │                         ▲                     │
│         │ HTTPS                   │ Prisma               │
│         ▼                         │                     │
│  ┌──────────────┐                 │                     │
│  │  Railway /   │─────────────────┘                     │
│  │  Render      │                                       │
│  │              │                                       │
│  │  apps/api    │                                       │
│  │  NestJS 11   │                                       │
│  │  (if present)│                                       │
│  └──────────────┘                                       │
│                                                         │
│  External CDNs:                                         │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Cloudinary │  │   Termii   │  │  Resend (email)  │  │
│  │  (media)    │  │   (SMS)    │  │  Phase 2+        │  │
│  └─────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 7.2 Frontend — Vercel

| Property | Value |
|----------|-------|
| Platform | Vercel (Next.js native hosting) |
| Region | `iad1` (US East) default; consider `fra1` (EU West) for lower latency to Lagos |
| Deploy trigger | Push to `main` → production; PR → preview deployment |
| Environment variables | Set in Vercel Dashboard — never in `.env` committed to repo |
| Custom domain | Configured via Vercel DNS or external DNS → CNAME |
| TLS | Automatic (Vercel managed cert) |
| Edge middleware | Runs globally at Vercel edge — JWT check before any page render |

**Vercel project settings** (`eventtrust-web`):
```
Build Command:  cd ../.. && pnpm turbo build --filter=web
Output Dir:     .next
Install Command: pnpm install --frozen-lockfile
Root Directory: apps/web
```

**Environment variables (Railway — `eventtrust-api`):**
```
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1
DIRECT_DATABASE_URL=postgresql://...  # for Prisma migrations only
JWT_SECRET=<64 random chars>
JWT_REFRESH_SECRET=<64 random chars, different>
TERMII_API_KEY=xxx
TERMII_SENDER_ID=EventTrust
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx   # NEVER expose to client
RESEND_API_KEY=xxx
FRONTEND_URL=https://eventtrust.com.ng
SENTRY_DSN=xxx
NODE_ENV=production
PORT=4000
```

**Environment variables (Vercel Dashboard — `eventtrust-web`):**
```
NEXT_PUBLIC_API_URL=https://api.eventtrust.com.ng
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
NEXT_PUBLIC_SENTRY_DSN=xxx
SENTRY_AUTH_TOKEN=xxx
```

> ⚠️ **NEVER** prefix secrets with `NEXT_PUBLIC_`. Only non-secret values (Cloudinary cloud name, public Sentry DSN) should be exposed to the client. Everything else is server-only (Railway env vars).

---

## 7.3 Backend — Railway (when apps/api is present)

Railway is preferred over Render for NestJS because it supports persistent processes (no sleep on free tier), has better Nigerian latency via US East, and handles environment variables cleanly.

| Property | Value |
|----------|-------|
| Platform | Railway |
| Service name | `eventtrust-api` |
| Region | US East (`us-east4`) |
| Deploy trigger | Push to `main` → auto-deploy |
| Health check | `GET /health` → 200 OK |
| Scaling | Single instance for MVP; horizontal scaling via Railway replicas |
| Dockerfile | See below |

**`apps/api/Dockerfile`:**
```dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm turbo build --filter=api

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

---

## 7.4 Database — Supabase Postgres

| Property | Value |
|----------|-------|
| Platform | Supabase (managed Postgres) |
| Region | `eu-west-2` (London) or `us-east-1` — closest managed region to West Africa |
| Connection pooling | PgBouncer (transaction mode) via `DATABASE_URL` |
| Direct connection | `DIRECT_URL` used only for Prisma migrations |
| Backups | Supabase daily backups (Pro plan — required for production) |
| Migrations | Prisma migrate — run in CI/CD, never manually in production |

**Prisma connection setup:**
```prisma
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // Pooled: ?pgbouncer=true&connection_limit=1
  directUrl = env("DIRECT_URL")      // Direct: for migrations only
}
```

---

## 7.5 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo run lint typecheck
      - run: pnpm turbo run test
      - run: pnpm turbo run build
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}   # Turborepo remote cache
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

  migrate:
    runs-on: ubuntu-latest
    needs: check
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - name: Run Prisma migrations
        run: pnpm --filter=api prisma migrate deploy
        env:
          DIRECT_DATABASE_URL: ${{ secrets.DIRECT_DATABASE_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**Deploy order (CRITICAL):**
1. Run Prisma migrations (`prisma migrate deploy`) → database
2. Deploy `apps/api` (Railway auto-deploys from `main` push)
3. Deploy `apps/web` (Vercel auto-deploys from `main` push)

> ⚠️ **Always run migrations BEFORE deploying new code.** If the new code expects a new column that doesn't exist yet, the deployment will fail. Use additive migrations (add columns as nullable, never drop in same PR as code change).

---

## 7.6 Environments

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| `local` | `localhost:3000` | `localhost:4000` | Local Postgres or Supabase dev project |
| `preview` | Vercel preview URL | Not deployed (uses production API) | Supabase dev project |
| `production` | `eventtrust.com.ng` | `api.eventtrust.com.ng` (Railway) | Supabase production project |

**Local development:**
```bash
# .env.local — never committed
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp_dev
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/myapp_dev
JWT_SECRET=local-dev-secret-not-for-production
TERMII_API_KEY=test_xxx  # Termii test mode
```

---

## 7.7 PWA Manifest & Service Worker

**`public/manifest.json`:**
```json
{
  "name": "EventTrust Nigeria",
  "short_name": "EventTrust",
  "description": "Find trusted event vendors and equipment rentals in Lagos",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#your-brand-color",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Service Worker caching strategy:**
```
Cache-First:    Static assets (/_next/static/*, fonts, icons)
Network-First:  API responses (fall back to cache if offline)
Stale-While-Revalidate: Pages (/listings, /profile)
Network-Only:   Auth endpoints (/api/auth/*)
Cache-Only:     Offline fallback page
```

---

## ✅ / ❌ Deployment Examples

### ✅ DO — Validate all environment variables at startup

```typescript
// apps/api/src/config/env.validation.ts
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  TERMII_API_KEY: z.string().min(10),
  CLOUDINARY_API_SECRET: z.string().min(10),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = EnvSchema.parse(process.env); // throws at startup if invalid
```

### ❌ DON'T — Deploy without migration step or with missing env vars

```bash
# ❌ Deploying code that expects new DB columns before migrating
git push origin main  # triggers Vercel deploy
# prisma migrate deploy  ← forgotten → app crashes on first DB query

# ❌ Missing env var discovered at runtime
# process.env.JWT_SECRET is undefined → all auth silently broken
```
