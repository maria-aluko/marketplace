# Scaffold Reference — EventTrust Nigeria Turborepo Configuration

> This file documents the actual Turborepo configuration for EventTrust Nigeria.

---

## `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "db:migrate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    },
    "test:e2e": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
```

---

## Root `package.json`

```json
{
  "name": "eventtrust",
  "private": true,
  "packageManager": "pnpm@9.x",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "db:migrate": "turbo run db:migrate --filter=api",
    "db:push": "turbo run db:push --filter=api",
    "db:seed": "turbo run db:seed --filter=api",
    "check-env": "tsx scripts/check-env.ts"
  },
  "devDependencies": {
    "turbo": "^2.8.x",
    "prettier": "^3.x",
    "typescript": "^5.9.x",
    "tsx": "^4.x"
  }
}
```

---

## `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## `packages/shared/package.json`

```json
{
  "name": "@eventtrust/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.25.x"
  },
  "devDependencies": {
    "@eventtrust/config": "workspace:*",
    "typescript": "^5.9.x",
    "tsup": "^8.x",
    "vitest": "^3.x"
  }
}
```

---

## `packages/config/package.json`

```json
{
  "name": "@eventtrust/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./eslint/base": "./eslint/base.js",
    "./eslint/nextjs": "./eslint/nextjs.js",
    "./eslint/nestjs": "./eslint/nestjs.js",
    "./typescript/base": "./typescript/base.json",
    "./typescript/nextjs": "./typescript/nextjs.json",
    "./typescript/nestjs": "./typescript/nestjs.json",
    "./prettier": "./prettier/index.js"
  }
}
```

---

## `packages/config/typescript/base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  }
}
```

---

## `apps/web/package.json`

```json
{
  "name": "web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "next build",
    "dev": "next dev --port 3000",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate deploy",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@eventtrust/shared": "workspace:*",
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "@tanstack/react-query": "^5.x",
    "zustand": "^5.x",
    "@prisma/client": "^6.x",
    "zod": "^3.25.x",
    "jose": "^5.x"
  },
  "devDependencies": {
    "@eventtrust/config": "workspace:*",
    "prisma": "^6.x",
    "tailwindcss": "^4.x",
    "@types/node": "^22.x",
    "@types/react": "^19.x",
    "vitest": "^3.x",
    "@testing-library/react": "^16.x",
    "@playwright/test": "^1.x"
  }
}
```

---

## `apps/api/package.json` (when present)

```json
{
  "name": "api",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@eventtrust/shared": "workspace:*",
    "@nestjs/common": "^11.x",
    "@nestjs/core": "^11.x",
    "@nestjs/platform-express": "^11.x",
    "@nestjs/jwt": "^11.x",
    "@nestjs/passport": "^11.x",
    "@nestjs/throttler": "^6.x",
    "@prisma/client": "^6.x",
    "zod": "^3.25.x",
    "argon2": "^0.x",
    "helmet": "^8.x",
    "cookie-parser": "^1.x",
    "pino": "^9.x"
  },
  "devDependencies": {
    "@eventtrust/config": "workspace:*",
    "@nestjs/cli": "^11.x",
    "@nestjs/testing": "^11.x",
    "prisma": "^6.x",
    "vitest": "^3.x",
    "supertest": "^7.x",
    "@types/supertest": "^6.x",
    "unplugin-swc": "^1.x",
    "@swc/core": "^1.x"
  }
}
```

---

## `.gitignore`

```
# Dependencies
node_modules
.pnp
.pnp.js

# Build outputs
.next
dist
build

# Env
.env
.env.local
.env.*.local

# Turbo
.turbo

# Testing
coverage

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/migrations/dev.db
```
