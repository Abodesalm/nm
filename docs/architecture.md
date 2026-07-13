# NM System — Architecture (living doc)

> Updated at the end of every session. What is ACTUALLY built, and the decisions behind it.
> Product spec: `NM_SYSTEM_COMPLETE_PLAN.md`. Session log: `CHANGELOG.md`.

## System overview

Next.js 16 (App Router, RSC) + React 19 + TypeScript. MongoDB via Mongoose 9 (`mongodb://localhost:27017/nm-system`), NextAuth 4 (Credentials + JWT), Cloudinary uploads, Recharts, xlsx-js-style export. Arabic RTL UI, inline styles + CSS variables (no Tailwind utility classes in components), right-side drawers for add/edit.

Sections enabled in the sidebar: employees, storage, history, finance, fieldwork, settings. (points/customers/problems/documents exist in code but are disabled.)

## Auth (username-based)

- `SystemUser { name, username (unique sparse lowercase), email? (unique sparse), password, isSuperAdmin, permissions[], sessions[] }`.
- Login form takes **username**; `authorize()` matches `$or: [{username}, {email}]` for backward compatibility.
- `permissionGuard(section, level)` guards every API route; super-admin bypass. Section list duplicated in `SystemUser.ts`, `seed.ts`, `api/settings/users/route.ts` — keep in sync.
- Seed: super admin `admin` / `@dm1n_te1c0m`; backfills username and `syncIndexes()` on old DBs.

## Money model (SYP-primary)

- `MoneyField { USD, SP, exchange }` on every money value; both amounts stored at the locked exchange rate of the moment (`calcMoney`, `MoneyInput` auto-derives the other currency; field order SP → USD → exchange).
- **SP is the primary display currency** everywhere in finance: big SP number, `≈ $` secondary. Stats/chart compare SP values.
- Default rate in `Settings.defaultExchangeRate`.

## Treasury — the money box (core decision)

- The company's real cash is modeled as ONE box whose balance is **derived, never stored**: `Σ deposits − Σ withdrawals` per currency over `TreasuryEntry` (`src/lib/treasury.ts → computeTreasuryBalance()`). Same philosophy as the MyMoney app.
- `TreasuryEntry { type: deposit|withdraw, source: manual|invoice|loan, amount, description, notes, relatedInvoice?, relatedLoan?, date }`.
- Automatic entries (with cascade delete via `deleteTreasuryEntriesByInvoice/ByLoan`):
  - Salary paid → withdraw of **amount + reward − deducted employee loans** (linked to the salary invoice).
  - Storage purchase → withdraw full cost; if bought on credit, only the paid-now part (linked to the loan instead).
  - Bonus/compensation → withdraw (linked to its `bonus` invoice).
  - Cash loan origin (`affectsTreasury`) → on_us deposits, for_us withdraws.
  - Loan payment → on_us withdraws, for_us deposits.
- Manual deposits/withdrawals set the real-life balance (e.g. opening balance) via the treasury drawer on the finance page.
- Invoices remain the **accrual** record (costs/earns for stats); the treasury is the **cash** record. They intentionally diverge for credit purchases.

## Business loans

- `Loan { direction: on_us|for_us, party, amount, payments[], status: open|paid, affectsTreasury, relatedStorageItem?, relatedActionId?, notes, date }`.
- `remaining = amount − Σ payments` per currency (`src/lib/loans.ts`); **SP is authoritative** for settled state (USD fallback for USD-only loans). Status auto-recomputed on payment add/remove.
- Credit purchase flow: storage action with cost + `loan.enabled` → full-cost invoice + `on_us` loan (paid-now as first payment) + treasury withdraw of paid-now only. Deleting the action deletes invoice, loan, and their treasury entries.
- UI: `finance/loans` page (summary per direction, filters, expandable payments, add/payment drawers); summary cards + links on the finance page.

## Finance section

- `Invoice { invoiceNumber (sequential via nextInvoiceNumber()), type: salary|subscription|storage_action|bonus, category: cost|earn, party refs, relatedId, amount, description, date }` — auto-created by source routes, cascade-deleted.
- `/api/finance/stats`: current vs prev month by category and type (incl. bonus), 12-month chart summing **SP**.
- Finance page: TreasurySection (balance + loans cards) → cost/earn cards + chart → 4 sub-stat cards (salaries, bonuses, subscriptions, storage) → invoice table (SP column first).
- Subscriptions: invoice type exists but no creation point yet (customers section disabled) — when enabled, remember to add the treasury deposit.

## Employees section

- `Employee` extras beyond basics: `salary` (MoneyField), `hireDate` (default now; old records fall back to `createdAt`), `absents[]`, `salaries[] {month, year, amount, reward}`, `loans[]` (سلف الموظفين — personal advances, distinct from business loans), `bonuses[] {type: reward|compensation, amount, reason, date}`, `hrPoints[] {points (±), reason, date}`.
- Monthly salary: one per month/year; drawer can deduct unpaid employee loans (`deductLoans` → server computes deduction for the treasury withdrawal and client marks the loans paid).
- Bonuses create a `bonus` cost invoice + treasury withdraw + history; HR points are non-financial (history only).
- Seniority: `formatSeniority(hireDate)` — profile header chip + sortable table column (`seniority` → `hireDate`).
- Profile page quick stats: absents, salaries, employee loans, bonuses, HR points — each opens its drawer.

## Storage section

- `StorageItem.actions[]` (stock_in/out/consume/borrow/return) with optional `cost`; quantities/status recomputed per mutation; point-equipment sync; History log per action.
- ActionDrawer: cost toggle → optional "شراء بالدين" (supplier + paid-now); server route validates loan fields BEFORE mutating.

## Conventions / meta

- `CLAUDE.md` — session ritual + non-negotiable rules. `.claude/skills/money-and-treasury` + `.claude/skills/nm-conventions` — the detailed expansions.
- API pattern: `permissionGuard` → `connectDB` → work → `ok()/err()`; generic CRUD via `makeCollectionHandlers/makeDocumentHandlers` where possible.
- Mongoose HMR: `Invoice`, `StorageItem`, `Point`, `Employee`, `TreasuryEntry`, `Loan` delete the cached model on reload; `SystemUser/Settings/Customer/History` use the `models.X ||` guard.

## Open items

- Run `npm run seed` on existing deployments (username backfill + index sync for the now-sparse email index).
- Customers/subscriptions: wire earn invoices → treasury deposits when the section is enabled.
- Points/problems/documents sections still disabled in the sidebar.
