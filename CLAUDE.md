# NM System

نظام إدارة شركة إنترنت (Arabic RTL) — employees, storage, finance (treasury + loans), field work, network points. Next.js App Router + MongoDB, self-hosted.

**`NM_SYSTEM_COMPLETE_PLAN.md` is the product spec.** `docs/architecture.md` is the living state of what's actually built — read it before changing anything.

## THE SESSION RITUAL

**START of every session:**
1. Read `CHANGELOG.md` (top entries) — what happened recently.
2. Read `docs/architecture.md` — current system state and decisions.
3. **USE SKILLS** — invoke every project skill relevant to the task (they live in `.claude/skills/`). Never rebuild what a skill already documents.

**END of every session:**
1. `npx tsc --noEmit` must pass. `npm run lint` must not add NEW issues.
2. Verify changed flows against the running app (or reason through the API contract end-to-end).
3. Add a CHANGELOG entry (newest first) + update `docs/architecture.md`.
4. Commit with a conventional message (`feat:` / `fix:` / `chore:` / `docs:`).

## Key rules (non-negotiable)

- **Arabic RTL UI only.** Labels, toasts, errors — all Arabic. Dates shown `en-GB` or `ar-SY`.
- **Styling = inline `style={{}}` + CSS variables** (`var(--text)`, `var(--surface)`, `var(--border)`, `var(--bg)`; primary `#f97316`). NOT Tailwind utility classes. Fonts: Cairo (titles), Tajawal (body).
- **Money = `MoneyField { USD, SP, exchange }`** everywhere, entered via `MoneyInput`. **SYP (SP) is the primary currency** — big number in SP, USD secondary. See the `money-and-treasury` skill before touching anything financial.
- **Treasury balance is never stored** — always derived from `TreasuryEntry` sums. Every real cash movement (salary paid, purchase, bonus, loan payment, manual entry) creates/deletes a `TreasuryEntry`.
- **Add/edit via right-side drawers** (`src/components/shared/Drawer.tsx`), deletes via `ConfirmDialog`.
- **Every API route** calls `permissionGuard(section, "readonly"|"full")` (from `src/lib/api-factory.ts`) then `connectDB()`. Responses via `ok()`/`err()`.
- **Cascades:** deleting a source record (salary, storage action, bonus, loan) must delete its History log, Invoice, and TreasuryEntry/Loan. Never leave orphans.
- **Login is by `username`** (lowercase, unique), not email. Email is optional metadata.
- Permission section enums live in THREE places — keep in sync: `SystemUser.ts` SECTIONS, `seed.ts`, `api/settings/users/route.ts`.
- Mongoose models: follow each file's existing HMR pattern (`deleteModel` / `delete mongoose.models[...]` vs `models.X ||` guard).

## Structure

| Path | Purpose |
|---|---|
| `src/app/(dashboard)/` | Pages: employees, storage, finance (+ `finance/loans`), history, fieldwork, settings |
| `src/app/api/` | Route handlers, one folder per resource |
| `src/lib/db/models/` | Mongoose schemas (source of truth for data shapes) |
| `src/lib/api-factory.ts` | ok/err, guards, generic CRUD handler factories |
| `src/lib/treasury.ts` | Treasury balance + entry helpers, `nextInvoiceNumber()` |
| `src/lib/loans.ts` | `loanRemaining()`, `isLoanSettled()` |
| `src/lib/utils.ts` | `formatSP/USD`, `calcMoney`, `formatSeniority` |
| `src/components/<section>/` | Section UI (tables + drawers) |
| `src/components/shared/` | Drawer, MoneyInput, ConfirmDialog, Pagination, StatusBadge |
| `src/types/index.ts` | TS mirrors of the Mongoose models |

## Dev commands

```bash
npm run dev          # Next dev server (needs local MongoDB: nm-system db)
npm run build        # production build
npx tsc --noEmit     # typecheck (must pass)
npm run lint         # eslint (legacy issues exist — don't add new ones)
npm run seed         # super admin (username: admin) + default settings
```

Environment: `.env.local` — `MONGODB_URI`, `NEXTAUTH_SECRET/URL`, Cloudinary keys. Docker: `docker-compose.yml`.
