# DMDS Runbook

Operational reference for the Dynamic Module Data System. For project overview and architecture, see [README.md](./README.md).

---

## Table of Contents

1. [Environment Setup](#1-environment-setup)
2. [Local Development](#2-local-development)
3. [Database Operations](#3-database-operations)
4. [Seed Data Reference](#4-seed-data-reference)
5. [API Key Security Model](#5-api-key-security-model)
6. [Build & Type-Check](#6-build--type-check)
7. [Vercel Deployment](#7-vercel-deployment)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Environment Setup

### `apps/api/.env`

| Variable | Required | Where to find it |
|----------|----------|-----------------|
| `DATABASE_URL` | ✅ | Supabase: **Project Settings → Database → Connection string** (URI mode). For local dev use the direct URL. In production use the pooled (pgBouncer) URL on port 6543. |
| `DIRECT_URL` | ✅ | Supabase: same page — the **direct** connection (port 5432). Required by Prisma for `migrate dev`. |
| `CLERK_SECRET_KEY` | ✅ | Clerk dashboard → **API Keys → Secret key** (`sk_test_…` or `sk_live_…`) |
| `PORT` | optional | Default `3001` |
| `NODE_ENV` | optional | `development` or `production` |
| `CORS_ORIGINS` | optional | Default `http://localhost:3000`. Comma-separate multiple origins in production. |

### `apps/web/.env`

| Variable | Required | Where to find it |
|----------|----------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk dashboard → **API Keys → Publishable key** (`pk_test_…`) |
| `CLERK_SECRET_KEY` | ✅ | Same as API — Clerk Secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | optional | Default `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | optional | Default `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | optional | Default `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | optional | Default `/dashboard` |
| `NEXT_PUBLIC_API_URL` | ✅ | URL of the NestJS API. Local: `http://localhost:3001`. Production: `https://dmds-api.vercel.app` |

---

## 2. Local Development

### Install dependencies (once)

```bash
pnpm install
```

### Start everything

```bash
# Both apps in parallel (recommended)
pnpm dev

# API only  (http://localhost:3001)
pnpm --filter api dev

# Web only  (http://localhost:3000)
pnpm --filter web dev
```

### Build API before first `dev` run

NestJS watch mode requires compiled output in `dist/` to exist on startup:

```bash
pnpm --filter api build
pnpm --filter api dev   # watch mode picks up changes from here
```

---

## 3. Database Operations

All Prisma commands run inside `apps/api`. Use `pnpm --filter api exec prisma …` from the repo root, or `cd apps/api && pnpm exec prisma …`.

### Apply a new migration (development)

```bash
pnpm --filter api exec prisma migrate dev --name describe_change
```

This generates SQL, applies it, and regenerates the Prisma client.

### Apply migrations in production

```bash
# Never use `migrate dev` in production — use deploy instead
pnpm --filter api exec prisma migrate deploy
```

### Reset database (wipes all data)

```bash
pnpm --filter api exec prisma migrate reset
# Prompts for confirmation, then drops + re-creates schema and re-seeds
```

### Seed sample data

```bash
pnpm --filter api exec prisma db seed
# Creates 15 modules × 5 records = 75 rows (idempotent — skips existing modules)
```

### Regenerate Prisma Client (after schema changes without migration)

```bash
pnpm --filter api exec prisma generate
# Or from root:
pnpm db:generate
```

### Open Prisma Studio (visual DB browser)

```bash
pnpm --filter api exec prisma studio
# Opens at http://localhost:5555
```

### View current schema

```
apps/api/prisma/schema.prisma
```

---

## 4. Seed Data Reference

The seed script (`apps/api/prisma/seed.ts`) creates data owned by seed user **`user_seed_demo_001`**.

> This is **not** a Clerk user — it exists only for DB-level testing. Sign in with a real Clerk account to use the dashboard. Since modules are global, the seeded modules appear for all authenticated users.

### 15 Modules

| # | Slug | Domain | Sensitive fields |
|---|------|--------|-----------------|
| 1 | `customers` | CRM | `credit_score` |
| 2 | `products` | E-commerce | — |
| 3 | `orders` | E-commerce | — |
| 4 | `inventory` | Warehouse | — |
| 5 | `employees` | HR | `salary`, `ssn_last4` |
| 6 | `invoices` | Finance | — |
| 7 | `support_tickets` | CX | — |
| 8 | `blog_posts` | CMS | — |
| 9 | `sales_leads` | CRM | `deal_value` |
| 10 | `transactions` | Payments | `card_last4` |
| 11 | `subscriptions` | SaaS | `mrr` |
| 12 | `analytics_events` | Analytics | — |
| 13 | `projects` | PM | — |
| 14 | `feedback` | UX | — |
| 15 | `shipments` | Logistics | — |

Each module has 5 sample records with realistic fake data.

---

## 5. API Key Security Model

### Key format

```
dmds_live_<64-hex-chars>        # PRODUCTION environment
dmds_sandbox_<64-hex-chars>     # SANDBOX environment
```

### What is stored vs. what is shown

| Thing | Stored in DB | Shown in UI |
|-------|-------------|-------------|
| Raw key | ❌ Never | ✅ Once, at creation only |
| SHA256 hash | ✅ `keyHash` column | ❌ Never |
| Key prefix | ✅ First ~15 chars | ✅ Always (e.g. `dmds_live_a3f2b`) |

**If a key is lost, it cannot be recovered.** The user must revoke it and create a new one.

### Field-level permission model (fail-closed)

- **No `ApiKeyFieldPermission` record** = field is **denied**
- **Record with `allowed: true`** = field is returned
- New fields added to a module are automatically inaccessible to existing keys
- The `strippedFields` array in data responses lists which fields were removed

### Authentication headers

```
# Dashboard routes (Clerk JWT)
Authorization: Bearer <clerk-session-jwt>

# External data routes (/api/data/*)
Authorization: Bearer dmds_live_<key>
```

---

## 6. Build & Type-Check

```bash
# Build all workspaces
pnpm build

# Type-check all workspaces
pnpm type-check

# Lint all workspaces
pnpm lint

# Format all files
pnpm format

# Build API only
pnpm --filter api build

# Build web only
pnpm --filter web build
```

Turbo caches build outputs — subsequent runs are instant if nothing changed.

---

## 7. Vercel Deployment

### Production URLs

| App | Canonical URL | Vercel Project |
|-----|---------------|----------------|
| API (NestJS) | https://dmds-api.vercel.app | `dmds-api` |
| Web (Next.js) | https://web-six-fawn-34.vercel.app | `web` |

### Vercel Project Config

| Project | `.vercel/project.json` location | Notes |
|---------|--------------------------------|-------|
| `dmds-api` | repo root `.vercel/project.json` | Deploy with `vercel --prod` from repo root |
| `web` | `apps/web/.vercel/project.json` | Deploy with `vercel --prod --cwd apps/web` |

### Deploy API

```bash
# From repo root
vercel --prod
```

The API uses a custom serverless handler at `apps/api/api/index.ts`. The `vercel.json` at `apps/api/` routes all requests through it:

```json
{
  "version": 2,
  "builds": [{ "src": "api/index.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "/api/index.ts" }]
}
```

The handler uses **lazy async imports** to prevent top-level module failures from crashing the serverless worker before the export is registered.

**Required env vars on `dmds-api` Vercel project:**
```
DATABASE_URL        = postgresql://...@...supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL          = postgresql://...@...supabase.com:5432/postgres
CLERK_SECRET_KEY    = sk_live_...
CORS_ORIGINS        = https://web-six-fawn-34.vercel.app,https://web-xaviers-projects-ab69d776.vercel.app
NODE_ENV            = production
```

The `vercel-build` script runs `prisma generate` (not `migrate`) so the Prisma client is available at runtime without touching the database during build.

### Deploy Web

```bash
# From repo root (uses apps/web/.vercel/project.json automatically)
vercel --prod --cwd apps/web
```

The web app uses `npm install --legacy-peer-deps` as its install command (configured on the Vercel project) because it is deployed without the pnpm workspace context.

Types from `@dmds/types` are **inlined** in `apps/web/src/types/` to eliminate the `workspace:*` dependency that would break non-monorepo deploys.

**Required env vars on `web` Vercel project:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_...
CLERK_SECRET_KEY                   = sk_live_...
NEXT_PUBLIC_API_URL                = https://dmds-api.vercel.app
NEXT_PUBLIC_CLERK_SIGN_IN_URL      = /sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL      = /sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL  = /dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL  = /dashboard
```

### Vercel Build Scripts

| App | Install | Build |
|-----|---------|-------|
| API | pnpm install (workspace root) | `prisma generate` (no NestJS compile needed — `@vercel/node` uses esbuild) |
| Web | `npm install --legacy-peer-deps` | `next build` |

---

## 8. Troubleshooting

### NestJS won't start — "Cannot find module dist/main"

The watch mode needs a prior build to exist:

```bash
pnpm --filter api build   # builds to dist/apps/api/src/main.js
pnpm --filter api dev     # watch picks up changes from there
```

If the entry file path changed, verify `nest-cli.json` contains:
```json
{ "entryFile": "apps/api/src/main" }
```

This is needed because the `@dmds/types` path alias resolves outside `src/`, causing TypeScript to root the output at the monorepo root rather than `apps/api/`.

---

### Vercel API: FUNCTION_INVOCATION_FAILED

This means the serverless handler crashed before exporting. Common causes:

1. **Missing dependency** — check that all `require()`/`import()` targets are in `apps/api/package.json` `dependencies` (not just `devDependencies`). Key one: `express` must be a direct dep.
2. **Top-level import failure** — the handler uses lazy async imports in `getBootstrap()` so errors surface as JSON 500s rather than silent crashes. If you see this error, check the function logs for the actual message.
3. **Env var missing at runtime** — verify all required vars are set on the Vercel project, not just locally.

```bash
vercel logs https://dmds-api.vercel.app --follow
```

---

### Vercel Web: MIDDLEWARE_INVOCATION_FAILED

Almost always means `CLERK_SECRET_KEY` is not set on the Vercel project:

```bash
vercel env ls --cwd apps/web     # list current env vars on the 'web' project
vercel env add CLERK_SECRET_KEY --cwd apps/web   # add if missing
vercel --prod --cwd apps/web     # redeploy to pick up new env var
```

Verify by checking the response headers — if Clerk middleware is working you'll see:
```
x-clerk-auth-status: signed-out
```

---

### Prisma migration fails

**Error:** `Environment variable not found: DATABASE_URL`
→ Check `apps/api/.env` exists and both `DATABASE_URL` and `DIRECT_URL` are set.

**Error:** `P1001 — Can't reach database server`
→ Supabase free-tier projects **auto-pause** after 1 week of inactivity. Go to the Supabase dashboard and click **Restore**.

**Error during `migrate dev`: SSL required**
→ Append `?sslmode=require` to your connection string.

---

### Clerk 401 on all dashboard requests

1. Verify `CLERK_SECRET_KEY` in `apps/api/.env` matches the secret key shown in the Clerk dashboard.
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `apps/web/.env` is the correct app's publishable key.
3. Ensure the Clerk application's **allowed origins** include `http://localhost:3000`.
4. Check the token isn't expired — sign out and sign back in.

---

### CORS errors in browser

`Access-Control-Allow-Origin` missing:
→ Add the web origin to `CORS_ORIGINS` in `apps/api/.env` (or in the Vercel project env vars for production):
```
CORS_ORIGINS=http://localhost:3000,https://web-six-fawn-34.vercel.app
```
Restart the API after changing env vars. On Vercel, redeploy after updating env vars.

---

### API key returns 401

1. Confirm the key prefix shown in the dashboard matches the key you're sending.
2. Check the key is not disabled (toggle in the Dashboard screen).
3. Verify the key hasn't expired (`expiresAt` in the DB).
4. Ensure the `Authorization` header is exactly `Bearer dmds_live_<key>` (no extra spaces).

---

### Field missing from data response

This is expected behaviour — the field is not in the API key's allowlist. In the dashboard:
1. Go to **API Keys** → find your key → **Edit Permissions**
2. Expand the module → scroll to the field → enable the toggle
3. Save. The field will appear in subsequent requests.

---

### TypeScript errors after `prisma generate`

If Prisma types change (e.g. `Json` field assignments), you may need to cast explicitly:
```typescript
data: cleanData as Prisma.InputJsonValue
```

Regenerate the client and restart the TS language server if errors persist:
```bash
pnpm db:generate
```

---

### Modules not showing up in the dashboard

Modules are **global** (not per-user). If no modules appear:
1. Run the seed: `pnpm --filter api exec prisma db seed`
2. Verify the API is reachable: `curl https://dmds-api.vercel.app/api/modules` (should return 401, not 502/500)
3. Check the web app's `NEXT_PUBLIC_API_URL` points to the correct API URL
