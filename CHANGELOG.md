# CHANGELOG

> Appended to at the end of every session. Read at the start of every session.
> Format per entry: date, what changed, files touched, next.

## 2026-07-23 — Global storage actions log (سجل حركات المخزون)

**What changed:**
- **New cross-item actions log** at `/storage/actions`: every action across every storage item in one filterable table (item, employee, quantity range, date range OR specific month, action type — with دخل/خرج group presets plus individual type chips). Row click opens the same read-only mini-profile used on the item page; a delete button removes the action.
- **"إضافة حركة" from the log adds an action to any item** — `ActionDrawer` gained a `mode="global"` that shows an item search-picker before the usual fields and posts to the new endpoint instead of a fixed item's route.
- **Deleting from the log is byte-identical to deleting from the item profile** — both now call the same shared functions, so the item's quantity/status revert, point-equipment sync reverses, the linked invoice/loan/treasury entries cascade-delete, and the same `action_deleted` History entry is written either way. Verified live: added an action via the global endpoint → quantity +7; deleted it via the global endpoint → quantity back to original, History shows `action_deleted`, action gone from the list.
- **Two new header buttons on the storage page**, دخل (green) and خرج (red), each linking to `/storage/actions` pre-filtered by the matching type group (`stock_in`+`return` vs `stock_out`/`consume`/`usage`/`borrow`/`custody`).
- Refactored the add/delete logic out of `api/storage/[id]/actions/route.ts` into `src/lib/storageActions.ts` (`addStorageActionToItem`, `deleteStorageActionFromItem`, `ApiError`) — the per-item route is now a thin wrapper, and the new global route (`api/storage/actions`) reuses the same functions. The global GET uses a `$unwind` aggregation over `StorageItem.actions` (actions have no separate collection) with an `employees` `$lookup` for the employee column.

**Files touched:**
- New: `src/lib/storageActions.ts`, `src/app/api/storage/actions/route.ts`, `src/app/(dashboard)/storage/actions/page.tsx`.
- Updated: `api/storage/[id]/actions/route.ts` (thin wrapper), `components/storage/ActionDrawer.tsx` (`mode`/global item picker), `app/(dashboard)/storage/page.tsx` (دخل/خرج buttons).

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds (`/storage/actions` compiles). End-to-end against the running production server: add via global endpoint, filter by item/type-group/quantity, delete via global endpoint with quantity reversal + History entry confirmed, all pages 200 after login. One bug caught and fixed during verification: `$unwind`'s option is `preserveNullAndEmptyArrays` (plural) — a singular typo made the aggregation 500 until corrected.

**Next:** none outstanding for this feature.

## 2026-07-23 (2) — Excel export on the storage actions log

- Added a "تصدير Excel" button to `/storage/actions`, matching the finance page's export convention: refetches the current filters with `limit=10000` (all matching rows, not just the visible page) and calls the shared `downloadXLSX` helper. Columns: العنصر, الفئة, النوع, الكمية, الوحدة, الموظف, الوجهة, التاريخ, الملاحظات, التكلفة (USD/ل.س). Refactored the page's filter-building into `buildFilterParams()` so the table fetch and the export reuse the exact same filter logic.
- Verified: page renders, `/api/storage/actions?page=1&limit=10000` returns the full filtered set with all export columns populated.

## 2026-07-22 — Terminology (علبة / دخل-خرج / تفقد العمل), treasury movements → invoices, unified absences, NEXTAUTH_URL fix

**What changed:**
- **Fixed a login-breaking config bug:** `.env.local` `NEXTAUTH_URL` was missing the protocol (`localhost:3000`), so NextAuth defaulted to `https://` + secure-cookie mode. The middleware's `getToken` then failed while API `getServerSession` still worked → every page 307-redirected to `/login` (empty sidebar, no user name, no data, broken logout). Set it to `http://localhost:3000`. Diagnosed with authenticated curl (pages 307 vs APIs 200). NOTE for deploys: this must always include the scheme.
- **Terminology renames (Arabic UI):** network **نقطة → علبة** (plural **نقاط → عُلب**) across the whole points domain (`components/points/*`, `app/(dashboard)/points/*`, `api/points/*`) + shared refs (storage action destination, history/dashboard/settings labels) — **HR نقاط التقييم left untouched**. Finance **إيداع → دخل**, **سحب → خرج** (treasury buttons, drawer toggle/labels, history labels, permission label, entry descriptions). **العمل الميداني → تفقد العمل** (sidebar, pages, permissions, users settings).
- **Manual treasury movements now create invoices.** Both دخل → `earn` and خرج → `cost` create a `treasury`-type `Invoice` (new enum value) linked to the `TreasuryEntry` and **cascade-deleted** when the movement is deleted. Manual money movements now show in finance cost/earn totals and the invoice table (new "حركة خزينة" type label + filter). Verified: create دخل/خرج → +2 invoices with correct categories → delete movements → invoices gone.
- **Unified absences on تفقد العمل (one source of truth).** Extracted the attendance calendar into a shared `AttendanceCalendar` component (auto-detected + manual overrides, day-override dialog). The تفقد العمل profile page and the employee-profile **AbsentsDrawer** now both render it, and the employee-profile "غيابات هذا الشهر" card pulls its count from `/api/fieldwork/attendance` — so numbers always match. Attendance GET now accepts **fieldwork OR employees** view permission.

**Files touched:**
- New: `src/components/fieldwork/AttendanceCalendar.tsx`.
- Model: `Invoice` (+`treasury` type). Config: `.env.local` (`NEXTAUTH_URL` scheme).
- Updated: `api/finance/treasury/route.ts` (invoice create + cascade), `api/fieldwork/attendance/[id]/route.ts` (dual guard), finance `page.tsx`/`InvoiceTable.tsx`/`invoices/[id]/page.tsx`, `TreasurySection.tsx`, `history/page.tsx`, `lib/permissions.ts`, `Sidebar.tsx`, `settings/users/page.tsx`, `fieldwork/page.tsx` + `fieldwork/[id]/page.tsx` (uses shared calendar), `AbsentsDrawer.tsx` (embeds shared calendar), `employees/[id]/page.tsx` (unified count), storage `ActionDrawer.tsx`/`[id]/page.tsx`, all `components/points/*` + `app/(dashboard)/points/*` + `api/points/*` (علبة rename), dashboards.

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds. Treasury-invoice create/cascade and the attendance API verified with authenticated requests against the running production server; all affected pages return 200 after login.

**Next:** restart the server after pulling (env + HMR-guarded models). Terminology is display-only — DB `section`/`type` keys stay English (`points`, `point_added`, `treasury`).

## 2026-07-18 — Storage action types/mini-profile, صناديق money categories, HR points pricing, fieldwork attendance (auto absence/overtime), per-user sidebar, granular permissions, audit-log sweep

**What changed:**
- **Storage: two new decreasing action types.** `usage` (استخدام, consume-like) and `custody` (أمانة — ours, handed to someone for an unknown duration; tracked in the borrowed counter like استعارة and returnable via إرجاع). Added to the model enum, `recalcQuantities()`, and all three label maps (ActionDrawer, item page, history page).
- **Storage: action mini-profile.** Action cards in سجل الحركات are now clickable → opens `ActionDrawer` in a new read-only mode (`viewAction` prop): same form, values filled, all inputs disabled, no submit. Notes now render prominently in their own highlighted row on each action card (was a cramped muted span), and الوجهة shows in Arabic with the resolved target name.
- **Storage: الوجهة locked for increasing actions.** For `stock_in`/`return` the destination field renders as a disabled "المستودع" input; client and server both force `goal_model/goal_id = null`.
- **Audit-log sweep (log everything).** New History entries for: storage item add/edit/hide/unhide/delete, action delete (`action_deleted` — previously deletions removed the log and left no trace), manual treasury deposit/withdraw + entry delete, funds (صناديق) add/edit/delete, absents add/edit/delete, HR-points delete. Storage item DELETE now also cascades each action's Invoice/Loan/TreasuryEntries (was leaving orphans).
- **Finance: money categories (الصناديق).** `Settings.funds[]` managed in a new settings page (الإعدادات ← المالية, `funds_manage`-guarded API `api/settings/finance`). `TreasuryEntry.category` (fund `_id`) + optional صندوق select in the treasury drawer; deleting a fund un-categorizes its records. New page `/finance/categories` (button in the treasury card): per-fund monthly stats (month/year filter) + lifetime stats + the month's records, via `/api/finance/categories` aggregation. Treasury delete button (manual entries only) restyled to be clearly visible.
- **HR points: price-per-point + monthly view.** `hrPoints[].pricePerPoint` (MoneyField, locked per adding operation, optional). HrPointsDrawer: MoneyInput for the price, entries grouped by month with per-month Σpoints and Σ(points × price) in SP (+USD), plus an all-time value card. Profile card shows current-month value. Informational only — no invoice/treasury coupling.
- **Fieldwork attendance (ملف الدوام).** Attendance is DERIVED, never stored: a day with no FieldWorkLog (or `not_arrived`) → auto absent; hours = `arrivedAt` → last `finished` status change; hours > `Settings.standardWorkHours` (new, default 8) → overtime; `Settings.weekendDays` (new, default Friday) skipped. A manual `absents[]` record (new `overtime` flag; `isAbsent:false` = manually present) always overrides auto detection. New `/api/fieldwork/attendance/[id]` (month days + month stats + all-time stats since hire) and `/fieldwork/[id]` profile page: stat cards, color-coded calendar (present/overtime/absent/excused/weekend, manual-override hand icon), click-a-day override dialog (writes via the absents API, removable → back to auto). Employee names in the fieldwork table/cards link to profiles. Settings ← عام gets standard-hours + weekend-days controls.
- **Per-user sidebar customization.** `SystemUser.sidebarPrefs[] {key, order, label}` + self-service `/api/me/sidebar` (GET/PATCH). Sidebar applies order + label overrides after fetch; "تخصيص القائمة" button opens a reorder/rename dialog (up/down + label inputs + reset to default). Per-account only.
- **Granular permissions.** `permissions[]` entries gain optional `actions` Map (action → bool). New catalog `src/lib/permissions.ts` (Arabic labels per section: view/add/edit/delete + salaries/absents/bonuses/hr-points/loans/treasury/funds/actions...). `permissionGuard(section, level, action?)`: an action present in the map overrides the level; missing → falls back; section "none" still hides everything. All API guard call-sites now pass action names. Users-settings permissions modal: per-section "تخصيص الإجراءات" expander with 3-state chips (default/allowed/denied). JWT serializes the Map at login (changes apply on re-login, same as levels). Fixed SECTIONS drift: `api/settings/users/route.ts` and `seed.ts` were missing `fieldwork`.

**Files touched:**
- New: `src/lib/permissions.ts`, `src/app/api/{me/sidebar,finance/categories,settings/finance,fieldwork/attendance/[id]}/route.ts`, `src/app/(dashboard)/{finance/categories,fieldwork/[id],settings/finance}/page.tsx`.
- Models: `StorageItem` (types enum), `TreasuryEntry` (+category), `Settings` (+funds, standardWorkHours, weekendDays), `Employee` (hrPoints.pricePerPoint, absents.overtime), `SystemUser` (+permissions.actions, sidebarPrefs).
- Updated: `api-factory.ts` (guard action param), `auth.ts` (Map→object in JWT), `treasury.ts` (category), storage routes ×3 + `ActionDrawer` + storage item page, treasury route + `TreasurySection`, hr-points route + `HrPointsDrawer` + employee profile page, absents route, fieldwork table/cards, `Sidebar`, settings general/users pages + users route, history page labels, `types/index.ts`, `seed.ts`.

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds (all new routes/pages compile). Lint: no new issue categories (pre-existing `no-explicit-any`/`exhaustive-deps` warnings repo-wide). Flows reasoned end-to-end against the API contracts; MongoDB-dependent runtime testing left for the running deployment.

**Next:** restart the dev server after pulling (SystemUser/Settings use the `models.X ||` HMR guard — schema additions need a restart). Permission/sidebar changes take effect at next login (JWT snapshot). Consider enforcing fine-grained checks in the UI (hide buttons the user's actions forbid) — currently server-side only.


## 2026-07-13 — Treasury (money box), business loans, username login, SYP-primary, employee bonuses/seniority/HR points + project conventions

**What changed:**
- **Treasury (الخزينة) — finance is now a money box, not a calculator.** New `TreasuryEntry` model; the balance is NEVER stored, always derived by summing entries (MyMoney model). Manual deposits/withdrawals via `/api/finance/treasury` + a treasury card & movements drawer at the top of the finance page (SP big, USD secondary). Every real cash movement now writes an entry automatically: salary paid (amount + reward − deducted employee loans), storage purchase (full cost, or only the paid-now part for credit purchases), bonus/compensation paid, loan origin (cash loans) and loan payments. Deleting the source cascades its entries.
- **Business loans (الديون).** New `Loan` model: `direction` on_us/for_us, party, amount, `payments[]` (remaining = amount − Σpayments, settled by SP as authoritative), `affectsTreasury` for cash loans. APIs: `/api/finance/loans` (list + summary + create), `/api/finance/loans/[id]` (addPayment/deletePayment/updateInfo/delete). New page `finance/loans` with summary cards, filters, expandable payment history, add-loan + payment drawers. Storage `ActionDrawer` got a "شراء بالدين" toggle: supplier name + optional paid-now amount; the remainder becomes an on_us loan linked to the action (cascade-deleted with it).
- **Username login.** `SystemUser.username` (unique sparse lowercase; email now optional sparse). NextAuth authorize looks up `$or: [username, email]` so old accounts still work. Login form is اسم المستخدم. Users settings CRUD + UI take username (regex `[a-zA-Z0-9_.-]{3,30}`). Seed creates/backfills super admin `admin` and runs `syncIndexes()`.
- **SYP primary, USD secondary.** MoneyInput field order SP→USD→exchange; finance StatCards show SP big with month-over-month % computed on SP; chart + tooltip sum SP; invoice table SP column first/bold; XLSX SP before USD.
- **Employee bonuses (المكافآت والتعويضات).** New `bonuses[]` subdocs (`reward`/`compensation`), API `/api/employees/[id]/bonuses` creating a `bonus`-type cost Invoice + treasury withdrawal + History (all cascade on delete). BonusesDrawer + stat card on the profile; bonus type in invoice filters/labels and a finance sub-stat card.
- **Employee seniority.** `hireDate` field (default now; falls back to `createdAt` for old records). `formatSeniority()` in utils; shown on the profile header ("في الشركة منذ...") and as a sortable الأقدمية column (server sort `seniority → hireDate`).
- **HR evaluation points (نقاط التقييم).** New `hrPoints[]` subdocs (positive or negative), API `/api/employees/[id]/hr-points` + History. HrPointsDrawer + profile stat card + total-points column in the employees table.
- **Salary invoice fix:** the treasury withdrawal for a salary uses amount + reward − loan deduction (drawer now sends `deductLoans`), so the box matches real cash paid.
- **Conventions bootstrapped** (Zuni/Zedu template): `CLAUDE.md` (session ritual + rules), this `CHANGELOG.md`, `docs/architecture.md`, `SESSION_PROMPTS.md`, `.claude/skills/{money-and-treasury,nm-conventions}`.

**Files touched:**
- New: `src/lib/db/models/{TreasuryEntry,Loan}.ts`, `src/lib/{treasury,loans}.ts`, `src/app/api/finance/{treasury,loans,loans/[id]}/route.ts`, `src/app/api/employees/[id]/{bonuses,hr-points}/route.ts`, `src/app/(dashboard)/finance/loans/page.tsx`, `src/components/finance/TreasurySection.tsx`, `src/components/employees/{BonusesDrawer,HrPointsDrawer}.tsx`, convention files.
- Updated: models `SystemUser/Employee/Invoice`, `auth.ts`, `seed.ts`, `login/page.tsx`, `settings/users` (route + page), `types/{index,next-auth.d}.ts`, `utils.ts`, `MoneyInput.tsx`, finance `stats/route.ts` + `page.tsx` + `InvoiceTable.tsx`, employees `route.ts` + `[id]/page.tsx` + `EmployeeTable.tsx` + `EmployeeDrawer.tsx` + `SalariesDrawer.tsx` + `salaries/route.ts`, storage `actions/route.ts` + `ActionDrawer.tsx`.

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds (all pages incl. `/finance/loans` compile). Lint adds no new categories (repo has pre-existing `no-explicit-any` style warnings throughout). Also fixed two latent bugs found on the way: ActionDrawer's date picker was never sent to the API, and the employee-loan `hidden` flag was `$set` without being declared in the schema (strict mode stripped it — it never persisted).

**Next:** run `npm run seed` once (username backfill + index sync); optionally record an opening deposit in the treasury to set the real starting balance; wire subscription earns to treasury when the customers section is enabled.
