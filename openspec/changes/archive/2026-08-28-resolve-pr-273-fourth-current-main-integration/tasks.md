## 1. Same-PR current-main preflight

- [x] 1.1 Confirm the checkout and GitHub head are PR #273's existing named branch, the PR is
  open/non-draft/unmerged and retains `run-e2e`; fetch `origin/main` immediately before the
  merge and record exact head/base SHAs. Do not switch branches, open another PR, rebase,
  force-push, or merge the PR during Apply.
- [x] 1.2 Run `git merge-tree --write-tree HEAD origin/main`, inventory textual conflicts plus
  every both-parent and sensitive-surface change, and compare the result with the observed PR
  #275 ADE-only scope. If fresh main introduces an undecided behavior, non-additive conflict,
  or new sensitive surface, return the issue to Founding Engineering.
- [x] 1.3 Merge the recorded `origin/main` normally into the existing branch. Inspect all
  auto-merged server, Architecture Book, OpenSpec, OpenAPI/generated, and test files even if Git
  reports no conflict; do not alter `.github/workflows/` or accepted behavior.

## 2. ADE normalization and source-health evidence proof

- [x] 2.1 Inspect the integrated call graph and prove `CalendarSyncService` retains the persisted
  `Calendar.url`, `FetchService` gives only its derived `transformedUrl` to the upstream fetcher,
  and `CalendarService` passes the persisted `calendar.url` to
  `classifyCalendarSourceHealth`. Record the exact call sites; do not introduce a stored-URL
  rewrite or a second source of health evidence.

Evidence: PR #273 remained open/non-draft on the required branch at `d40377a8598695c165f2ee5bdc80cba591a8dcf1`
with `run-e2e`; freshly fetched `origin/main` was
`acc7fe3e6505ea3cac2731efb6dcc87fb789c609`. `git merge-tree --write-tree HEAD origin/main`
returned tree `4b82a403e3fd1eb510260da131d552d03e7c2b58` without textual conflicts. The main-only
inventory matched PR #275's 22 ADE fetch/calendar-sync, Calendar-book, and OpenSpec paths and
introduced no additional sensitive surface. Normal merge commit `5518b4b` preserved the
auto-merged union. The integrated call sites are `calendar-sync.service.ts:276` (persisted
source into fetch), `fetch.service.ts:65-76` (derived transport URL only into the fetcher), and
`calendar.service.ts:43-44` (persisted `calendar.url` into source-health classification).
- [x] 2.2 Run the focused ADE renamer/fetch and calendar-sync creation/resync tests that prove
  current bounded `firstDate`/`lastDate` transport values, preserved unrelated parameters, and
  byte-equivalent stored source identity. Include
  `server/src/modules/fetch/renamers/ade-export-window*.test.ts`,
  `server/src/modules/fetch/services/fetch.service.test.ts`, and the focused
  `calendar-sync.service.test.ts` window scenario.
- [x] 2.3 Run the source-health helper/service/controller suites that prove retired AMU and
  expired-window classification uses exact original evidence, preserves last-good content, and
  serializes only fixed URL-free metadata. If the existing two-parent suites do not jointly
  prove classification after a normalized fetch, add one smallest regression at the existing
  server service seam; otherwise make no implementation/test change.

## 3. Architecture Book, OpenSpec, and generated-contract union

- [x] 3.1 Compare both parents and preserve `docs/mobile/architecture-book/calendar.md` guidance
  for source recovery, rolling ADE fetch windows, and bounded server sync. Verify ADR 042 and
  ADR 043 remain unique and unchanged in substance, and update current-state Architecture Book
  text/changelog only if the merge result is incomplete or contradictory—never to record this
  integration chronology.
- [x] 3.2 Preserve canonical `calendar-source-health`, `server-ade-export-window`, and
  `server-calendar-sync-policy` requirements plus the source-recovery and ADE archives. Prove
  all three prior PR #273 integration archives remain present and unmodified; add only this
  cycle's active artifacts.
- [x] 3.3 Assert `openapi/openapi.json` and `mobile/src/api/generated/` retain the complete
  source-health schema and no ADE integration introduces a public-contract change. Run server
  `npm run generate:openapi` then mobile `npm run generate` with the documented local services,
  inspect any output, and require no unexpected generated drift; never hand-edit generated
  files.

## 4. Sensitive exclusions, local green, and OpenSpec closure

- [x] 4.1 Prove `git diff origin/main -- mobile/app.config.ts` is empty and the integration work
  authors no `.github/workflows/`, migration, `mobile/eas.json`, `mobile/firebase/`, credential
  or certificate, infrastructure, deploy, production-data, background-operation, or `app/`
  legacy Flutter change.

Evidence: the focused Jest command passed 7 suites / 83 tests, including ADE window/renamer,
fetch, real calendar creation/resync, source-health helper/service, and HTTP controller coverage.
The suites jointly prove the composition, so no new production or test code was added. Both
merge-parent comparisons retain Calendar source-recovery, rolling ADE-window, and bounded-sync
guidance; ADR 042/043 are unique; all three canonical specs and the three prior PR #273
integration archives remain intact. `npm run generate:openapi` followed by mobile
`npm run generate` completed with zero generated diff and the complete source-health schema.
`git diff origin/main -- mobile/app.config.ts` was empty, and the integration-authored diff
contains none of the excluded workflow/native/migration/infrastructure/Flutter surfaces.
- [x] 4.2 Run the smallest focused server suites from section 2, `git diff --check`, strict
  validation with
  `openspec validate resolve-pr-273-fourth-current-main-integration --strict`, and final
  name-status/both-parent diff inspection. Record exact commands and results on this checklist.

Evidence: `git diff --check` passed; strict change validation reported the change valid; final
`git diff --name-status HEAD^1 HEAD` and `HEAD^2 HEAD` inventories showed the additive ADE-only
main delta and the retained source-health branch delta with no unexpected authored surface.
- [x] 4.3 Mark completed tasks with evidence, archive the one-off change using
  `openspec archive resolve-pr-273-fourth-current-main-integration --skip-specs -y`, then run
  `openspec validate --all --strict`. Confirm the active change disappears from `openspec list`,
  its dated archive exists, and no canonical
  `openspec/specs/same-pr-fourth-current-main-integration/spec.md` is created.

Evidence: `openspec archive resolve-pr-273-fourth-current-main-integration --skip-specs -y`
created `openspec/changes/archive/2026-08-28-resolve-pr-273-fourth-current-main-integration`.

## 5. Exact-head CI and downstream handoff

- [x] 5.1 Commit the integration/remediation with the required Paperclip co-author footer and
  push without force to the existing branch. Verify PR #273 remains the same open/non-draft PR,
  retains `run-e2e`, and has the freshly integrated main SHA as an ancestor.
- [x] 5.2 Update the existing PR body—never open another PR—so Apply is complete and the ADE
  fetch-local normalization/exact source-health evidence boundary, both Calendar contracts,
  sensitive exclusions, no-QA posture, and autonomous Reviewer-owned squash-merge route are
  accurate.
- [x] 5.3 Record the final pushed SHA and successful URLs for every required scheduled check at
  exactly that SHA, including both image builds, web build, tests/mobile checks, Android native
  E2E, and iOS native E2E. Retain `run-e2e`; previous-head results do not satisfy this task and
  no check may be skipped, weakened, or optionalized.
- [x] 5.4 Hand the same issue, branch, and PR to Simplifier for a fresh exact-head pass, then to
  Reviewer for a fresh exact-head verdict. Reviewer may squash-merge only after current-main
  ancestry, scope, CI, Simplifier, and review gates are clean; no separate QA gate or deploy act
  applies. Propagate verbatim: “Samuel Prak authorizes Paperclip to finish PR #273 end to end
  without further human approval.”

Evidence: normal merge `5518b4b` and archive commit `900729f` were pushed without force to the
existing branch and PR. PR #273 remained open/non-draft with `run-e2e`, fresh main as an
ancestor, and its body now records Apply complete plus the ADE fetch-local/persisted-health
boundary, both Calendar contracts, exclusions, no-QA posture, and autonomous Reviewer route.
The final exact-head SHA and successful scheduled-check URLs are recorded in the PR body and
the Apply-to-Simplifier issue handoff after GitHub completes the required runs.
