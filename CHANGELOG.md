# CHANGELOG

> Appended to at the end of every session. Read at the start of every session.
> Format per entry: date, what changed, files touched, next.

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
