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
7. [Deployment Checklist](#7-deployment-checklist)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Environment Setup

### `apps/api/.env`

| Variable | Required | Where to find it |
|----------|----------|-----------------|
| `DATABASE_URL` | ✅ | Supabase: **Project Settings → Database → Connection string** (URI mode). For local dev you can use the direct URL for both. In production use the pooled (pgBouncer) URL on port 6543. |
| `DIRECT_URL` | ✅ | Supabase: same page — the **direct** connection (port 5432). Prisma requires this for `migrate dev`. |
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
| `NEXT_PUBLIC_API_URL` | ✅ | URL of the NestJS API. Local: `http://localhost:3001`. Production: your deployed API URL. |

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

> This is **not** a Clerk user — it exists only for DB-level testing. Sign in with a real Clerk account to use the dashboard.

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

## 7. Deployment Checklist

### API (NestJS)

- [ ] Set all env vars: `DATABASE_URL`, `DIRECT_URL`, `CLERK_SECRET_KEY`, `CORS_ORIGINS`, `NODE_ENV=production`
- [ ] Run `pnpm --filter api exec prisma migrate deploy` (not `migrate dev`)
- [ ] Run `pnpm --filter api build`
- [ ] Start with `node dist/apps/api/src/main.js` (or the equivalent for your host)
- [ ] Verify `GET /api/health` returns 200 (if health endpoint is added)

### Web (Next.js)

- [ ] Set all env vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_API_URL` (production API URL)
- [ ] Run `pnpm --filter web build`
- [ ] Serve with `pnpm --filter web start` or deploy to Vercel/similar

### Database

- [ ] Confirm Supabase project is not paused (free tier auto-pauses after 1 week of inactivity)
- [ ] Use the **pooled** pgBouncer URL for `DATABASE_URL` in production (port 6543, `?pgbouncer=true`)
- [ ] Use the **direct** URL for `DIRECT_URL` (port 5432, used by Prisma migrate deploy)

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

### Prisma migration fails

**Error:** `Environment variable not found: DATABASE_URL`
→ Check `apps/api/.env` exists and both `DATABASE_URL` and `DIRECT_URL` are set.

**Error:** `P1001 — Can't reach database server`
→ Supabase free-tier projects **auto-pause** after 1 week of inactivity. Go to the Supabase dashboard and click **Restore**.

**Error during `migrate dev`: SSL required**
→ Append `?sslmode=require` to your connection string.

---

### Clerk 401 on all dashboard requests

1. Verify `CLERK_SECRET_KEY` in `apps/api/.env` matches the secret key shown in the Clerk dashboard (not the publishable key).
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `apps/web/.env` is the correct app's publishable key.
3. Ensure the Clerk application's **allowed origins** include `http://localhost:3000`.
4. Check the token isn't expired — sign out and sign back in.

---

### CORS errors in browser

`Access-Control-Allow-Origin` missing:
→ Add the web origin to `CORS_ORIGINS` in `apps/api/.env`:
```
CORS_ORIGINS=http://localhost:3000,https://your-prod-domain.com
```
Restart the API after changing env vars.

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
