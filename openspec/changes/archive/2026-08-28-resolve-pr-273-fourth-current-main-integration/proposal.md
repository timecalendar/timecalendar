## Why

PR #273 is clean and fully gated at exact head `7095734e1b7e086f1cdb6bde688c49b056c34a4b`,
but freshly fetched `main` advanced to `acc7fe3e6505ea3cac2731efb6dcc87fb789c609`. The
current-main ancestry gate therefore vetoes merge until the same PR absorbs the newly landed
ADE export-window normalization and proves it does not invalidate source-health evidence.

## What Changes

- Normally merge freshly fetched `origin/main` into PR #273's existing branch without rebasing,
  force-pushing, replacing the branch, or opening another PR.
- Preserve PR #273's accepted source-health classification, exact stored-URL evidence,
  last-good content, recovery guidance, ADR 043, and additive server/mobile API contract.
- Preserve main's ADE export-window normalization for fetch-time `firstDate`/`lastDate`, its
  creation/resync behavior, Calendar guidance, canonical specifications, and archive.
- Inspect the semantic seam explicitly: fetch-time URL normalization must not rewrite the
  stored calendar URL or cause source health to classify the normalized transport URL instead
  of the exact persisted evidence. Add only the focused regression/contract proof needed if
  the existing two-parent tests do not establish that invariant.
- Preserve both Calendar contracts, ADR 042 and ADR 043, and generated contract parity. Leave
  `mobile/app.config.ts` and `.github/workflows/` unchanged by this cycle.
- Archive this one-off integration change, push without force, retain `run-e2e`, and require
  fresh exact-head local/CI, Simplifier, and Reviewer evidence before the already-authorized
  autonomous squash merge.

## Capabilities

### New Capabilities

- `same-pr-fourth-current-main-integration`: One-off integration requirements for preserving
  PR #273, the ADE normalization/source-health evidence boundary, and fresh exact-head gates.
  This operational delta is archived with `--skip-specs`; it is not a reusable product
  capability.

### Modified Capabilities

None. The canonical source-health, ADE export-window, and calendar-sync requirements remain
unchanged.

## Impact

- Existing PR #273 and branch
  `TIM-186-prod-health-investigation-at-rentr-e-2026-write-docs-investigations-2026-08-25-rentree-prod-health-report`
  only.
- Server seam: stored `Calendar.url` evidence and
  `classifyCalendarSourceHealth` remain distinct from fetch-time strategy/renamer output.
- Binding documentation and specifications: `docs/mobile/architecture-book/`, ADR 042, ADR
  043, `openspec/specs/calendar-source-health`, `openspec/specs/server-ade-export-window`, and
  `openspec/specs/server-calendar-sync-policy` retain both parents' accepted contracts.
- Sensitive coupled contract surfaces `openapi/openapi.json` and
  `mobile/src/api/generated/` retain source health without drift. Sensitive native/store config
  `mobile/app.config.ts` remains identical to main; `.github/workflows/` remains untouched by
  integration work.
- No product behavior, dependency, migration, credential/certificate, infrastructure, deploy,
  production-data, background-sync, or legacy Flutter change is in scope.
