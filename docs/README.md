# EventTrust Nigeria — Architecture Documentation

> **arc42-based architecture guide for EventTrust Nigeria.**
> A verified event vendor marketplace for services and equipment rentals in Lagos.

---

## What This Doc Set Covers

This documentation describes the architecture of **EventTrust Nigeria** using the arc42 template structure. Each section is a standalone `.md` file. Reference only what you need per conversation.

- **Product scope reference:** `planv2.md` — full product vision, listing types, subscription model, business tools
- **Coding reference:** `CLAUDE.md` — conventions, module map, code examples, business rules
- **Build roadmap:** `IMPLEMENTATION_PLAN.md` — phased checklist with exit criteria

---

## Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router, PWA) → Vercel |
| Backend | NestJS 11 → Railway |
| Database | Supabase Postgres + Prisma ORM |
| Shared | `@eventtrust/shared` — Zod schemas, enums, types, constants |
| Auth | Phone OTP (Termii) → JWT (httpOnly cookies) |
| Media | Cloudinary (signed URL uploads, CDN) |
| Email | Resend |
| Monorepo | Turborepo + pnpm workspaces |

---

## Architecture Sections

| # | File | Summary |
|---|------|---------|
| 2 | [02-constraints.md](./02-constraints.md) | Technical, regulatory, regional, and team constraints |
| 3 | [03-context-scope.md](./03-context-scope.md) | External actors, system boundary, in/out-of-scope |
| 4 | [04-solution-strategy.md](./04-solution-strategy.md) | Core solution decisions and technology rationale |
| 5 | [05-building-blocks.md](./05-building-blocks.md) | Monorepo structure, API modules, frontend pages |
| 6 | [06-runtime-view.md](./06-runtime-view.md) | Key runtime scenarios (auth, listing creation, WhatsApp contact) |
| 7 | [07-deployment-view.md](./07-deployment-view.md) | Infrastructure, hosting, CI/CD, environments |
| 8 | [08-crosscutting-concepts.md](./08-crosscutting-concepts.md) | Auth, validation, audit logging, mobile-first UI, WhatsApp contact |
| 9 | [09-architecture-decisions.md](./09-architecture-decisions.md) | ADR log — key decisions with rationale |
| 10 | [10-quality-requirements.md](./10-quality-requirements.md) | Quality tree, scenarios, performance budgets |
| 11 | [11-risks-technical-debt.md](./11-risks-technical-debt.md) | Known risks, mitigations, debt register |
| 12 | [12-glossary.md](./12-glossary.md) | EventTrust domain and technical terms |

---

## Key ADRs

| ADR | Decision |
|-----|---------|
| [ADR-001](./ADR-001-monorepo.md) | Turborepo monorepo over separate repos |
| ADR-004 | Phone OTP + JWT httpOnly cookies (in 09-architecture-decisions.md) |
| ADR-008 | Unified Listing entity for services and rentals (in 09-architecture-decisions.md) |

---

## Scaffold Reference

[SCAFFOLD-REFERENCE.md](./SCAFFOLD-REFERENCE.md) — Turborepo config, package.json files, TypeScript config.
