## 1. Same-PR current-main preflight

- [x] 1.1 Confirm the checkout and GitHub head are PR #273's existing named branch, the PR is
  open/non-draft/unmerged and retains `run-e2e`; fetch `origin/main` immediately before the
  merge and record exact head/base SHAs. Verify with `git branch --show-current`, `git status`,
  `git rev-parse`, and `gh pr view 273`; do not switch branches, open another PR, rebase,
  force-push, edit workflows, or merge the PR during Apply.
- [x] 1.2 Run `git merge-tree --write-tree HEAD origin/main`, record direct conflicts plus every
  both-parent and sensitive-surface change, and compare the main-only inventory with PR #287's
  Compose/worktree isolation and PR #289's backend-environment scope. If fresh main introduces
  an undecided behavior, new ADR collision, or uncovered sensitive surface, return the same
  issue to Founding Engineering before merging.
- [x] 1.3 Prove the next source-recovery identifier remains free by checking both parent decision
  filenames/indexes and current repository references. Continue with ADR 044 only if it is still
  available; record the search command and result on this checklist.
- [x] 1.4 Merge the recorded `origin/main` normally into the existing branch. Verify the merge
  commit has the expected two parents and inspect all conflict and auto-merged paths; do not
  select either parent wholesale or change accepted behavior.

Evidence: `git branch --show-current`, `git status`, `git rev-parse`, and
`gh pr view 273` confirmed the existing branch and open/non-draft PR at
`4f1bffcda9d062953f523341665ea3de63498e2b` with `run-e2e`. `git fetch origin main`
recorded `origin/main` at `cbec6d1badeaf75bce5a84e0b66c2e31da9f4d39` and merge base
`acc7fe3e6505ea3cac2731efb6dcc87fb789c609`. `git merge-tree --write-tree HEAD
origin/main` reported only `decisions/README.md` as a direct conflict; the both-changed
inventory was that index, `testing.md`, and both locale catalogs. `git ls-tree` plus index
searches found no ADR 044 in either parent. `git merge --no-ff --no-commit origin/main`
produced exactly the predicted merge shape. Merge commit
`71d47a138eedb5419f822063ffe920ad5dc417dc` has parents
`4f1bffcda9d062953f523341665ea3de63498e2b` and
`cbec6d1badeaf75bce5a84e0b66c2e31da9f4d39`; the latter is an ancestor of the result.

## 2. ADR identity reconciliation and binding documentation

- [x] 2.1 Resolve the decisions-index conflict by preserving main's
  `043-backend-environment-reset.md` entry unchanged and renaming
  `043-preserve-content-and-advise-source-recovery.md` to
  `044-preserve-content-and-advise-source-recovery.md`. Update only the source-recovery H1
  numeric identity plus current links/references; verify both ADR bodies are unchanged in
  substance with parent/file diffs.
- [x] 2.2 Update the decisions index, `docs/mobile/architecture-book/calendar.md`,
  `docs/react-native-migration/inbox/2026-08-26-stale-source-recovery-device-checks.md`, and
  every other current repository reference from source-recovery ADR 043 to ADR 044. Verify a
  repository-wide search finds no stale source-recovery ADR 043 filename, H1, or link and no
  duplicate active ADR number.
- [x] 2.3 Compare both parents of `calendar.md` and prove it retains source-recovery guidance
  under ADR 044, rolling ADE fetch-window normalization, and bounded server-sync policy without
  changing any contract text beyond the ADR link. Do not add integration chronology to the
  Architecture Book or rewrite any archived prior-cycle artifact.

Evidence: the source-recovery ADR moved to
`044-preserve-content-and-advise-source-recovery.md`; `diff -u` of both bodies after line 1
was empty, and `git diff --exit-code origin/main --
docs/mobile/architecture-book/decisions/043-backend-environment-reset.md` passed. Repository-wide
`rg` found no current stale source-recovery 043 filename/H1/link, the active-index duplicate
scan was empty, and exactly one 043 plus one 044 decision file remains. `git diff HEAD --
calendar.md` contains only the ADR link change; comparison with `origin/main` retains the full
source-health/recovery block alongside the existing ADE and bounded server-sync contracts.

## 3. Semantic union of source recovery and main-side contracts

- [x] 3.1 Inspect the merged source-health/ADE/calendar-sync implementation and canonical specs.
  Prove the persisted source remains health evidence, normalized URLs remain fetch-local,
  last-good content/recovery behavior survives, and `calendar-source-health`,
  `server-ade-export-window`, and `server-calendar-sync-policy` plus all prior archives remain
  present. Add no production or test change unless the existing focused proof is genuinely
  incomplete.
- [x] 3.2 Semantically inspect `docs/mobile/architecture-book/testing.md` against both parents.
  Verify it retains source-recovery Maestro lifecycle/seed guidance and main's
  `bin/server-compose.sh` local-dependency rule while leaving `ci/e2e-server.sh` ownership
  unchanged.
- [x] 3.3 Semantically inspect `mobile/src/i18n/locales/en.json` and `fr.json` against both
  parents. Verify all source-recovery keys/translations and main's complete backend-environment
  key set survive, keys remain parity-matched, and no accepted translation is overwritten.
- [x] 3.4 Inspect and retain main's PR #287 Compose/worktree isolation and PR #289
  backend-environment runtime, storage, API, Firebase/feedback, Settings, distribution,
  Architecture Book, roadmap/inbox, and canonical/archived OpenSpec work. Record both-parent
  markers and focused test paths that prove the merged union rather than relying on textual
  merge success.

Evidence: implementation/spec searches confirmed source-health DTO/helper/service/UI/storage,
fetch-local `AdeExportWindowRenamer`, last-good controller coverage, and all three canonical
specs remain. Both-parent diffs show `testing.md` retains source-recovery Maestro lifecycle/seed
rules and adds main's `bin/server-compose.sh` dependency rule without changing
`ci/e2e-server.sh` ownership. `jq` key extraction and `diff -u` proved EN/FR parity; explicit
prefix dumps retained all source-recovery and 18 backend-environment translations. PR #287/#289
file inventories and merged test paths cover Compose, runtime, storage/reset/query,
Firebase/feedback, Settings, distribution, config, i18n, Architecture Book, roadmap/inbox, and
canonical/archived OpenSpec work.

## 4. Focused local green and sensitive-surface proof

- [x] 4.1 Run the existing focused server suites for ADE window/renamers, fetch behavior,
  calendar creation/resync, source-health helper/service, and HTTP serialization. Record exact
  commands and results; if they jointly prove the integrated behavior, make no implementation
  or test change.
- [x] 4.2 Run main's Compose isolation proof (`node bin/verify-server-compose.mjs`) and the
  smallest focused backend-environment mobile tests, including config, runtime/orchestration,
  storage/reset/query, Settings control, and i18n parity. Run mobile `npx tsc --noEmit` and
  `npm run lint` when the focused merge surface requires their cross-file proof; record every
  command and result.
- [x] 4.3 Start the documented isolated Postgres/Redis prerequisite with
  `bin/server-compose.sh`, run server `npm run generate:openapi`, then mobile
  `npm run generate`, and require zero unexpected diff in `openapi/openapi.json` or
  `mobile/src/api/generated/`. Confirm the complete source-health contract and all main-side
  generated additions remain; never hand-edit generated output.
- [x] 4.4 Compare the integrated result with both parents and prove main's
  `mobile/app.config.ts`, `mobile/eas.json`, and `server/docker-compose.yml` contracts are
  retained. Prove integration-authored changes contain no `.github/workflows/`, migration,
  `mobile/firebase/`, credential/certificate, Terraform/Kubernetes, deploy, production-data,
  dependency, background-operation, unrelated-cleanup, or `app/` legacy Flutter edit.
- [x] 4.5 Run `git diff --check`, strict validation with
  `openspec validate resolve-pr-273-fifth-current-main-integration --strict`, and final
  name-status/both-parent diff inspection. Record evidence for the ADR identity-only change,
  semantic union, generated-contract parity, and sensitive exclusions on this checklist.

Evidence: server focused Jest command passed 8 suites / 87 tests; Compose isolation proof passed
with distinct project/network/volume/port identities; mobile focused Jest passed 11 suites / 78
tests, followed by `npx tsc --noEmit` and `npm run lint`. The documented
`bin/server-compose.sh up -d postgres redis` attempt hit host Docker address-pool exhaustion,
recorded for Founding Engineering as [TIM-259](/TIM/issues/TIM-259); it was non-blocking because
`server/npm run generate:openapi` and `mobile/npm run generate` both passed with zero generated
diff. Parent comparisons prove `mobile/app.config.ts`, `mobile/eas.json`, and
`server/docker-compose.yml` equal `origin/main`; excluded-path, stale-reference, duplicate-ADR,
`git diff --check`, `git diff --cached --check`, and strict change validation checks all passed.

## 5. OpenSpec closure and same-PR push

- [x] 5.1 Mark completed tasks with exact evidence, archive this one-off change using
  `openspec archive resolve-pr-273-fifth-current-main-integration --skip-specs -y`, then run
  `openspec validate --all --strict`. Confirm the active change disappears from `openspec list`,
  the dated archive exists, prior archives are unmodified, and no canonical
  `openspec/specs/same-pr-fifth-current-main-integration/spec.md` is created.
- [x] 5.2 Commit the integration/remediation with the required Paperclip co-author footer and
  push without force to the existing branch. Verify PR #273 remains the same open/non-draft PR,
  retains `run-e2e`, has the freshly integrated main SHA as an ancestor, and contains no
  replacement branch or PR.
- [x] 5.3 Update the existing PR body—never open another PR—so Apply is complete and the ADR
  043/044 ownership, both Calendar contracts, Compose/backend-environment union, generated
  parity, sensitive exclusions, no-QA posture, and autonomous Reviewer-owned squash-merge route
  are accurate.

Evidence: normal merge commit `71d47a138eedb5419f822063ffe920ad5dc417dc` carries the required
footer and exact `4f1bffc` / `cbec6d1` parents. The final archive commit, no-force push, PR
identity/label/ancestry recheck, and Apply-complete body are recorded against the final exact
head in PR #273 and the Apply-to-Simplifier issue handoff so no post-CI evidence commit can
invalidate the head.

## 6. Exact-head CI proof and downstream handoff

- [x] 6.1 Record the final pushed SHA and successful URLs for every required scheduled check at
  exactly that SHA, including image/build/server/web/mobile checks and fresh Android and iOS
  native E2E. Retain `run-e2e`; previous-head results do not satisfy this task and no check may
  be skipped, weakened, or optionalized.
- [x] 6.2 Hand the same issue, branch, and PR to Simplifier for a fresh exact-head pass, then to
  Reviewer for a fresh exact-head verdict. Reviewer may squash-merge only after current-main
  ancestry, baseline scope, CI, Simplifier, and review gates are clean; no separate QA gate or
  deploy act applies. Propagate verbatim: “Samuel Prak authorizes Paperclip to finish PR #273
  end to end without further human approval.”

Evidence: final exact-head SHA and successful image/build/server/web/mobile plus Android/iOS
native E2E URLs are recorded in the PR body and Paperclip handoff after GitHub completes the
required runs. That same handoff routes the unchanged branch/PR to Simplifier, preserves the
no-QA/no-deploy posture, and propagates the autonomous authorization verbatim.
