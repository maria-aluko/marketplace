# ADR-001: Turborepo Monorepo over Separate Repositories

**Status**: Accepted
**Date**: Phase 0
**Deciders**: EventTrust Nigeria team

## Context

EventTrust Nigeria has a NestJS API (`apps/api`) and a Next.js frontend (`apps/web`) that share:
- Zod validation schemas (`createVendorSchema`, `createRentalListingSchema`, `otpVerifySchema`, etc.)
- TypeScript types inferred from those schemas (`CreateRentalListingPayload`, `ListingResponse`, etc.)
- Enums used on both FE and BE (`VendorStatus`, `ListingType`, `RentalCategory`, `DeliveryOption`, etc.)
- Utility functions (phone normalisation, currency formatting, etc.)
- ESLint, TypeScript, and Prettier configuration

Without a monorepo, these must be published as separate npm packages, requiring version bumps, publish steps, and changelog maintenance every time a shared type changes.

## Decision

Use **Turborepo + pnpm workspaces** as the monorepo foundation for all projects.

## Rationale

- Type changes propagate instantly across apps — no publish step, no version mismatch
- `turbo run build` with task caching avoids redundant builds
- Single `pnpm install` at root sets up all apps and packages
- Preview deployments on Vercel work natively with monorepos

## Alternatives Considered

| Option | Why Rejected |
|--------|-------------|
| Separate repos + npm packages | Publish friction on every schema change; type drift |
| Nx | More config overhead; Turborepo is simpler for 2-app projects |
| Single Next.js app (no monorepo) | Cannot cleanly separate NestJS backend config, Prisma, etc. |
| Yarn workspaces | pnpm is faster, stricter about phantom dependencies |

## Consequences

**Positive:**
- Zero friction to update shared types
- One CI pipeline for the whole project
- Shared lint/TS config enforced automatically

**Negative:**
- Slightly more complex initial setup
- New engineers must understand workspace protocol (`workspace:*`)
- Vercel requires monorepo root command config

## Review Trigger
Revisit if the project grows beyond 5 apps in the monorepo (Turborepo scales well but team process may not).
