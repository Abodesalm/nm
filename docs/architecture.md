# NM System — Architecture (living doc)

> Updated at the end of every session. What is ACTUALLY built, and the decisions behind it.
> Product spec: `NM_SYSTEM_COMPLETE_PLAN.md`. Session log: `CHANGELOG.md`.

## System overview

Next.js 16 (App Router, RSC) + React 19 + TypeScript. MongoDB via Mongoose 9 (`mongodb://localhost:27017/nm-system`), NextAuth 4 (Credentials + JWT), Cloudinary uploads, Recharts, xlsx-js-style export. Arabic RTL UI, inline styles + CSS variables (no Tailwind utility classes in components), right-side drawers for add/edit.

Sections enabled in the sidebar: employees, storage, history, finance, fieldwork, settings. (points/customers/problems/documents exist in code but are disabled.)

## Auth (username-based) + granular permissions

- `SystemUser { name, username (unique sparse lowercase), email? (unique sparse), password, isSuperAdmin, permissions[], sidebarPrefs[], sessions[] }`.
- Login form takes **username**; `authorize()` matches `$or: [{username}, {email}]` for backward compatibility.
- **Permissions = per-section level + fine-grained overrides.** Each `permissions[]` entry: `{ section, permission: none|readonly|full, actions?: Map<string,bool> }`. `permissionGuard(section, level, action?)` (api-factory.ts): super-admin bypass → "none" hides the section entirely → an action present in the map overrides the level → otherwise the level decides. **This "fallback to section level" is only correct for a plain `view`-style flag** — it never actually blocks a `readonly`-required check (its fallback condition is `required==="full"`), so any action meant to be a hard, exclusive gate must NOT use `permissionGuard` directly (see storage's `income_access`/`outcome_access` below, which learned this the hard way). Action catalog + Arabic labels live in `src/lib/permissions.ts` (single source of truth for the users-settings UI chips). All routes pass action names (e.g. `salaries_add`, `treasury_delete`).
- The JWT snapshots permissions (Map flattened to a plain object in `authorize()`) — changes apply at next login. Enforcement is server-side; UI buttons are not yet hidden per action.
- Section list duplicated in `SystemUser.ts`, `seed.ts`, `api/settings/users/route.ts` — keep in sync (all three include `fieldwork` now).
- **History (السجل) is read-only by design** — no `delete` action exists for it (removed from the catalog along with the API's `DELETE` handler and the page's delete button). Logs are only ever created via their source record's own route and only ever cascade-removed when that source is deleted; there is no manual "delete a log entry" feature.
- **Per-user sidebar**: `sidebarPrefs[] {key: href, order, label?}` edited via the sidebar's "تخصيص القائمة" dialog, stored through self-service `/api/me/sidebar` (GET/PATCH, self only). The Sidebar fetches prefs on mount and applies order + label overrides.
- Seed: super admin `admin` / `@dm1n_te1c0m`; backfills username and `syncIndexes()` on old DBs.

## Money model (SYP-primary)

- `MoneyField { USD, SP, exchange }` on every money value; both amounts stored at the locked exchange rate of the moment (`calcMoney`, `MoneyInput` auto-derives the other currency; field order SP → USD → exchange).
- **SP is the primary display currency** everywhere in finance: big SP number, `≈ $` secondary. Stats/chart compare SP values.
- Default rate in `Settings.defaultExchangeRate`.

## Treasury — the money box (core decision)

- The company's real cash is modeled as ONE box whose balance is **derived, never stored**: `Σ deposits − Σ withdrawals` per currency over `TreasuryEntry` (`src/lib/treasury.ts → computeTreasuryBalance()`). Same philosophy as the MyMoney app.
- `TreasuryEntry { type: deposit|withdraw, source: manual|invoice|loan, amount, description, notes, category? (صندوق, Settings.funds _id), relatedInvoice?, relatedLoan?, date }`.
- **Money categories (الصناديق):** `Settings.funds[] {name}` CRUD in settings ← المالية (`api/settings/finance`, `funds_manage` action). Manual entries may carry a `category`; deleting a fund un-categorizes its entries. `/finance/categories` page (`/api/finance/categories`) shows per-fund monthly (filterable) + lifetime deposit/withdraw/net sums and the month's records; "بدون صندوق" bucket collects uncategorized entries. Manual entries are the only deletable ones from the treasury drawer (visible red button); deletes are History-logged.
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

- `Employee` extras beyond basics: `salary` (MoneyField), `hireDate` (default now; old records fall back to `createdAt`), `absents[] {date, isAbsent, excused, overtime?, reason, note}`, `salaries[] {month, year, amount, reward}`, `loans[]` (سلف الموظفين — personal advances, distinct from business loans), `bonuses[] {type: reward|compensation, amount, reason, date}`, `hrPoints[] {points (±), pricePerPoint? (MoneyField), reason, date}`.
- Monthly salary: one per month/year; drawer can deduct unpaid employee loans (`deductLoans` → server computes deduction for the treasury withdrawal and client marks the loans paid).
- Bonuses create a `bonus` cost invoice + treasury withdraw + history; HR points are non-financial (history only) but each add operation can lock a **price per point** — HrPointsDrawer groups entries by month and shows Σpoints and Σ(points × price) per month + all-time (SP primary), so "how much the employee deserves" is visible. Purely informational; paying stays a salary/bonus matter.
- Seniority: `formatSeniority(hireDate)` — profile header chip + sortable table column (`seniority` → `hireDate`).
- Profile page quick stats: absents, salaries, employee loans, bonuses, HR points — each opens its drawer.

## Storage section

- `StorageItem.actions[]` — 8 types: `stock_in`, `stock_out`, `consume`, `usage` (استخدام, consume-like), `borrow`, `custody` (أمانة — ours, out for unknown duration; shares the borrowed counter with borrow and is settled by `return`), `return`, `other` (أخرى — see below). Optional `cost` + `gain` (bool, default false); quantities/status recomputed per mutation (`recalcQuantities` → `isIncreasingAction`: only `stock_in`/`return`/`other`-with-`flowDirection:"in"` increase); point-equipment sync; History log per action.
- **Increasing actions always target the warehouse**: الوجهة renders as a locked "المستودع" input and `goal_model/goal_id` are forced null client- and server-side.
- **Cost can flip to a gain**: "+ إضافة تكلفة أو مكسب" reveals a تكلفة/مكسب toggle. مكسب mode flips everything downstream — `Invoice.category` `earn` not `cost`, treasury `deposit` not `withdraw`, "بيع بالدين" builds a `for_us` `Loan` instead of `on_us`. The mini-profile/list/export all read `action.gain` to show it in green with a `+` sign.
- ActionDrawer: cost/gain toggle → optional "شراء بالدين"/"بيع بالدين" (supplier-or-customer party + paid/received-now); server route validates loan fields BEFORE mutating. **Read-only mode** via `viewAction` prop — clicking an action card on the item page opens the same form filled and disabled (the action "mini profile"). Notes render as a highlighted block on each action card. **`mode="global"`** adds an item search-picker and posts to the cross-item log endpoint instead of a fixed item's route (used by the log page's "إضافة حركة").
- **Actions can only be ADDED from the دخل/خرج pages** — there is no add-action button on the item profile or on the storage list's row menu anymore, only view (mini-profile) and delete. `api/storage/[id]/actions` has no `POST` handler at all (only `DELETE`); adding always goes through `api/storage/actions` (the global route), so the `income_access`/`outcome_access` gate can't be bypassed via a per-item back door.
- **All three storage-action entry points are gated by `requireDirectionAccess(direction)`** (`storageActions.ts`), not by `permissionGuard` — a dedicated, non-fallback check needed because `income_access`/`outcome_access` must act as a hard, exclusive gate (see § Auth above for why the generic guard can't do this). It requires the specific direction's key to be explicitly `true` (or full section permission), and requires **both** explicitly granted (or full) for the neutral/direction-less overview. DELETE routes never trust a client-supplied direction — they load the target action and determine its real direction server-side (`isIncreasingAction`) before gating, so a request can't dodge the check by omitting/spoofing the direction field.
- **Storage list table** (`StorageTable.tsx`) shows "الكمية الأولية" (initial quantity) — the item's first-ever action's quantity (`actions[0]`, "—" if none), alongside الكمية الحالية/المستعار/الحالة. `api/storage` GET uses `.slice("actions", 1)` (not a full exclude) so this is available without shipping each item's whole action history to the list view.
- Every storage mutation is History-logged: item add/edit/hide/delete, action add, and action delete (an `action_deleted` entry — the original action log is cascade-removed but the deletion itself stays auditable). Item delete cascades every action's Invoice/Loan/TreasuryEntry.
- **Add/delete core logic lives in `src/lib/storageActions.ts`** (`addStorageActionToItem`, `deleteStorageActionFromItem`) — the per-item route's `DELETE` and the global route's `POST`/`DELETE` all call the same functions, so behavior (quantity recalculation, point-equipment sync, History, Invoice/Loan/Treasury cascade) is guaranteed identical regardless of entry point. `addStorageActionToItem` accepts an optional `enforceDirection` used only by the locked دخل/خرج pages (validates the submitted type matches the page's direction; sets `flowDirection` for `other`). `deleteStorageActionFromItem` does no permission logic itself — the calling route determines the action's real direction and gates on it (via `requireDirectionAccess`) before calling in.
- **"أخرى" (other) — direction comes from the page, never the type.** Unlike every other type, `other` has no inherent in/out direction; it persists a `flowDirection: "in"|"out"` set by the server from the request's page context — the client's own claim is never trusted for this. It's rejected outright (400) with no direction context, so it only exists when created from a دخل/خرج-locked page; the item profile's and the neutral overview's type pickers never offer it (though a pre-existing "other" action still displays correctly everywhere — colored green `+`/red `-` by its `flowDirection`, same convention as the gain/cost ± sign).
- **دخل and خرج are isolated, locked pages — not just filtered views.** `/storage/actions?direction=in|out` (`api/storage/actions` reads the same `direction`): the UI drops the cross-direction presets and only offers same-direction type chips + أخرى; the add-form (`ActionDrawer restrictDirection`) only offers same-direction types; the server independently re-enforces the boundary on GET (aggregation `$and`-guarded — a spoofed `types` param can't leak the other direction), POST (wrong-direction `type` → 400), and DELETE (wrong-direction action, determined server-side → 403) — the UI lock is convenience, the server lock (`requireDirectionAccess`) is the actual guarantee. Gated by two dedicated permissions, `income_access`/`outcome_access` (§ Auth), each independently controlling that whole page (view+add+delete); the storage page's `hasStorageAction()` mirrors the same explicit-`true`-required semantics to hide the button when denied.
- **Global actions log** (`/storage/actions`, `api/storage/actions`): every action across every item via a `$unwind` aggregation over `StorageItem.actions` (there is no separate Action collection) with an `employees` `$lookup`. Filters: item, employee, quantity range, date range OR a specific month, and action type (multi-select; the دخل/خرج presets only appear in the unlocked overview). Reached either directly (unlocked, all types except أخرى) or via the storage page's دخل/خرج header buttons (`?direction=in` / `?direction=out`, locked as above).

## Fieldwork attendance (ملف الدوام)

- **Attendance is DERIVED, never stored** (same philosophy as the treasury): `/api/fieldwork/attendance/[id]?month&year` merges, per day since `hireDate`:
  1. A manual `absents[]` record for that date **always wins** (`isAbsent:false` = manually present; `overtime` flag manual).
  2. Otherwise the day's `FieldWorkLog`: missing or `not_arrived` → auto absent; any other status → present. Hours = `arrivedAt` → last `finished` statusHistory timestamp; hours > `Settings.standardWorkHours` → auto overtime.
  3. `Settings.weekendDays` (JS getDay numbers, default Friday) → عطلة, skipped by auto absence.
- `/fieldwork/[id]` — per-employee profile: month stat cards + all-time stats (worked/absents/overtime/hours), color-coded calendar, click-a-day override dialog writing through `/api/employees/[id]/absents` (delete override → back to auto). Employee names on the fieldwork board link here.
- Standard hours + weekend days configured in settings ← عام.

## Conventions / meta

- `CLAUDE.md` — session ritual + non-negotiable rules. `.claude/skills/money-and-treasury` + `.claude/skills/nm-conventions` — the detailed expansions.
- API pattern: `permissionGuard` → `connectDB` → work → `ok()/err()`; generic CRUD via `makeCollectionHandlers/makeDocumentHandlers` where possible.
- Mongoose HMR: `Invoice`, `StorageItem`, `Point`, `Employee`, `TreasuryEntry`, `Loan` delete the cached model on reload; `SystemUser/Settings/Customer/History` use the `models.X ||` guard.

## Open items

- Run `npm run seed` on existing deployments (username backfill + index sync for the now-sparse email index).
- Customers/subscriptions: wire earn invoices → treasury deposits when the section is enabled.
- Points/problems/documents sections still disabled in the sidebar.
- Fine-grained permission `actions` are enforced server-side only — the UI does not yet hide buttons a user's overrides forbid.
- Attendance overrides write through the employees `absents` API, so they require employees-section permission (not just fieldwork).
- JWT snapshots permissions + at login — permission/sidebar edits apply at next login.
