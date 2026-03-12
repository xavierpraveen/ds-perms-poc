# Dynamic Module Data System (DMDS)

A full-stack API key management platform that lets you create user-defined data modules, issue scoped API keys, and enforce field-level access control — all with a visual dashboard.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js 15  (apps/web  :3000)                         │ │
│  │  Ant Design · TanStack Query · Clerk (session cookie)  │ │
│  └────────────────┬───────────────────────────────────────┘ │
└───────────────────│─────────────────────────────────────────┘
                    │ Authorization: Bearer <clerk-jwt>
                    │ Authorization: Bearer dmds_live_*
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  NestJS API  (apps/api  :3001)                              │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────┐ │
│  │  ClerkGuard   │  │  ApiKeyGuard  │  │ RequestLogger   │ │
│  │  (dashboard)  │  │  (/api/data)  │  │ Interceptor     │ │
│  └───────────────┘  └───────────────┘  └─────────────────┘ │
│  Modules · ApiKeys · Data · Logs                            │
└──────────────┬──────────────────────┬───────────────────────┘
               │ Prisma ORM           │ verifyToken()
               ▼                      ▼
      ┌─────────────────┐    ┌──────────────────┐
      │  Supabase       │    │  Clerk           │
      │  (PostgreSQL)   │    │  (Auth provider) │
      └─────────────────┘    └──────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | [Turborepo](https://turbo.build) + pnpm workspaces |
| Frontend | Next.js 15 (App Router), React 19 |
| UI | Ant Design 5, Tailwind CSS |
| Data fetching | TanStack Query v5 |
| Backend | NestJS 10 |
| ORM | Prisma 5 |
| Database | PostgreSQL via [Supabase](https://supabase.com) |
| Auth | [Clerk](https://clerk.com) (dashboard) + SHA256-hashed API keys (external) |
| Shared types | `packages/types` (`@dmds/types`) |

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** ≥ 10 (`npm install -g pnpm`)
- A **[Supabase](https://supabase.com)** project (free tier works)
- A **[Clerk](https://clerk.com)** application (free tier works)

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/xavierpraveen/ds-perms-poc.git
cd ds-perms-poc

# 2. Copy env templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Fill in credentials (see .env files for what each var means)
#    — Supabase: Project Settings → Database → Connection String
#    — Clerk:    Dashboard → API Keys

# 4. Install dependencies
pnpm install

# 5. Run database migration and seed 15 sample modules
cd apps/api
pnpm exec prisma migrate dev --name init
pnpm exec prisma db seed
cd ../..

# 6. Start both apps
pnpm dev
```

| App | URL |
|-----|-----|
| Dashboard (Next.js) | http://localhost:3000 |
| API (NestJS) | http://localhost:3001 |

Sign in with Clerk at http://localhost:3000/sign-in. Your user record is auto-created on first login.

---

## Dashboard Screens

| Route | Screen | Purpose |
|-------|--------|---------|
| `/dashboard/keys` | API Credentials Dashboard | View all keys, usage sparklines, revoke |
| `/dashboard/keys/new` | Access Config Wizard | Create key + assign module/field permissions |
| `/dashboard/keys/[id]/test` | API Key Tester | In-browser Postman-like playground |
| `/dashboard/logs` | Request Logs Inspector | Filter & inspect every API call |
| `/dashboard/modules` | Module Manager | Create and edit dynamic data modules |

---

## Using the External API

All external data access uses your `dmds_live_*` or `dmds_sandbox_*` API key.

```bash
# List records (GET)
curl -H "Authorization: Bearer dmds_live_<your-key>" \
  http://localhost:3001/api/data/customers

# Create a record (POST)
curl -X POST \
  -H "Authorization: Bearer dmds_live_<your-key>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "tier": "gold"}' \
  http://localhost:3001/api/data/customers

# Pagination
curl "http://localhost:3001/api/data/customers?limit=10&offset=0" \
  -H "Authorization: Bearer dmds_live_<your-key>"
```

**Security model:**
- Raw keys are shown **once** at creation and never stored — only a SHA256 hash is kept.
- Field-level permissions are **fail-closed**: if a field isn't explicitly allowed, it is stripped from the response.
- Sensitive fields (marked `⚠` in the wizard) require explicit access grant even when the module is allowed.

**Key formats:**
- Production: `dmds_live_<64-hex-chars>`
- Sandbox: `dmds_sandbox_<64-hex-chars>`

---

## Workspace Layout

```
dynamic-module-data-system/
├── apps/
│   ├── api/               NestJS backend
│   │   ├── src/
│   │   │   ├── auth/      ClerkGuard, ApiKeyGuard
│   │   │   ├── api-keys/  Key CRUD, permissions, sparkline
│   │   │   ├── modules/   Dynamic module + field management
│   │   │   ├── data/      External data CRUD (API key auth)
│   │   │   └── logs/      Request log queries
│   │   └── prisma/        schema.prisma, migrations, seed.ts
│   └── web/               Next.js frontend
│       └── src/
│           ├── app/       App Router pages
│           ├── components/ UI components by feature
│           ├── hooks/     TanStack Query hooks
│           └── lib/       api-client.ts, query-client.ts
└── packages/
    └── types/             @dmds/types — shared DTOs & enums
```

---

## Sample Data

Running `prisma db seed` creates **15 realistic modules** (75 records total) owned by seed user `user_seed_demo_001`:

customers · products · orders · inventory · employees · invoices · support_tickets · blog_posts · sales_leads · transactions · subscriptions · analytics_events · projects · feedback · shipments

Sensitive fields (credit_score, salary, ssn_last4, deal_value, card_last4, mrr) are flagged in the schema and visible in the wizard UI.

> **Note:** The seed user ID (`user_seed_demo_001`) is not a Clerk user. Sign in with a real Clerk account to use the dashboard — your account is auto-created on first login and will have its own empty module list.

---

## See Also

- **[RUNBOOK.md](./RUNBOOK.md)** — operational commands, troubleshooting, deployment checklist
