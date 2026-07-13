# Session Prompts — NM System

Copy-paste prompts for Claude Code sessions. The ritual itself lives in `CLAUDE.md`.

## 1. Standard feature/fix session

```
Read CLAUDE.md, the top of CHANGELOG.md, and docs/architecture.md first.
Invoke the project skills relevant to this task (.claude/skills/).

Task: <describe the feature or fix>

Rules: follow CLAUDE.md non-negotiables (Arabic RTL, inline styles + CSS vars,
drawers, MoneyField/MoneyInput with SP primary, permissionGuard on every route,
history/invoice/treasury cascades). At the end: tsc --noEmit must pass, add a
CHANGELOG entry, update docs/architecture.md, commit with a conventional message.
```

## 2. Financial-domain session (anything touching money)

```
Read CLAUDE.md and docs/architecture.md, then invoke the money-and-treasury skill
BEFORE writing any code. Remember: treasury balance is derived, never stored;
every real cash movement creates a TreasuryEntry; invoices are accrual, treasury
is cash; SP is the primary currency everywhere.

Task: <describe>
```

## 3. Planning session (new module / big change)

```
Start in plan mode. Read CLAUDE.md, CHANGELOG.md, docs/architecture.md and the
relevant sections of NM_SYSTEM_COMPLETE_PLAN.md. Explore the code paths involved,
then propose a plan that reuses the existing patterns (api-factory guards, drawers,
MoneyInput, cascade rules). Do not implement until the plan is approved.

Module: <describe>
```

## 4. Session-zero bootstrap (for a NEW project copying this template)

```
Create the convention set: CLAUDE.md (project description, LOCKED-plan pointer,
THE SESSION RITUAL with a USE SKILLS step, non-negotiable rules, structure table,
dev commands — keep under ~150 lines), CHANGELOG.md (newest-first, per-session
entries: What changed / Files touched / Next), docs/architecture.md (living state),
SESSION_PROMPTS.md (this file's shape), and .claude/skills/<domain>/SKILL.md for
each domain with hard rules. Then write the first CHANGELOG entry.
```
