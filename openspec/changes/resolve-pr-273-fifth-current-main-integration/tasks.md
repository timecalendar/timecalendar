## 1. Same-PR current-main preflight

- [ ] 1.1 Confirm the checkout and GitHub head are PR #273's existing named branch, the PR is
  open/non-draft/unmerged and retains `run-e2e`; fetch `origin/main` immediately before the
  merge and record exact head/base SHAs. Verify with `git branch --show-current`, `git status`,
  `git rev-parse`, and `gh pr view 273`; do not switch branches, open another PR, rebase,
  force-push, edit workflows, or merge the PR during Apply.
- [ ] 1.2 Run `git merge-tree --write-tree HEAD origin/main`, record direct conflicts plus every
  both-parent and sensitive-surface change, and compare the main-only inventory with PR #287's
  Compose/worktree isolation and PR #289's backend-environment scope. If fresh main introduces
  an undecided behavior, new ADR collision, or uncovered sensitive surface, return the same
  issue to Founding Engineering before merging.
- [ ] 1.3 Prove the next source-recovery identifier remains free by checking both parent decision
  filenames/indexes and current repository references. Continue with ADR 044 only if it is still
  available; record the search command and result on this checklist.
- [ ] 1.4 Merge the recorded `origin/main` normally into the existing branch. Verify the merge
  commit has the expected two parents and inspect all conflict and auto-merged paths; do not
  select either parent wholesale or change accepted behavior.

## 2. ADR identity reconciliation and binding documentation

- [ ] 2.1 Resolve the decisions-index conflict by preserving main's
  `043-backend-environment-reset.md` entry unchanged and renaming
  `043-preserve-content-and-advise-source-recovery.md` to
  `044-preserve-content-and-advise-source-recovery.md`. Update only the source-recovery H1
  numeric identity plus current links/references; verify both ADR bodies are unchanged in
  substance with parent/file diffs.
- [ ] 2.2 Update the decisions index, `docs/mobile/architecture-book/calendar.md`,
  `docs/react-native-migration/inbox/2026-08-26-stale-source-recovery-device-checks.md`, and
  every other current repository reference from source-recovery ADR 043 to ADR 044. Verify a
  repository-wide search finds no stale source-recovery ADR 043 filename, H1, or link and no
  duplicate active ADR number.
- [ ] 2.3 Compare both parents of `calendar.md` and prove it retains source-recovery guidance
  under ADR 044, rolling ADE fetch-window normalization, and bounded server-sync policy without
  changing any contract text beyond the ADR link. Do not add integration chronology to the
  Architecture Book or rewrite any archived prior-cycle artifact.

## 3. Semantic union of source recovery and main-side contracts

- [ ] 3.1 Inspect the merged source-health/ADE/calendar-sync implementation and canonical specs.
  Prove the persisted source remains health evidence, normalized URLs remain fetch-local,
  last-good content/recovery behavior survives, and `calendar-source-health`,
  `server-ade-export-window`, and `server-calendar-sync-policy` plus all prior archives remain
  present. Add no production or test change unless the existing focused proof is genuinely
  incomplete.
- [ ] 3.2 Semantically inspect `docs/mobile/architecture-book/testing.md` against both parents.
  Verify it retains source-recovery Maestro lifecycle/seed guidance and main's
  `bin/server-compose.sh` local-dependency rule while leaving `ci/e2e-server.sh` ownership
  unchanged.
- [ ] 3.3 Semantically inspect `mobile/src/i18n/locales/en.json` and `fr.json` against both
  parents. Verify all source-recovery keys/translations and main's complete backend-environment
  key set survive, keys remain parity-matched, and no accepted translation is overwritten.
- [ ] 3.4 Inspect and retain main's PR #287 Compose/worktree isolation and PR #289
  backend-environment runtime, storage, API, Firebase/feedback, Settings, distribution,
  Architecture Book, roadmap/inbox, and canonical/archived OpenSpec work. Record both-parent
  markers and focused test paths that prove the merged union rather than relying on textual
  merge success.

## 4. Focused local green and sensitive-surface proof

- [ ] 4.1 Run the existing focused server suites for ADE window/renamers, fetch behavior,
  calendar creation/resync, source-health helper/service, and HTTP serialization. Record exact
  commands and results; if they jointly prove the integrated behavior, make no implementation
  or test change.
- [ ] 4.2 Run main's Compose isolation proof (`node bin/verify-server-compose.mjs`) and the
  smallest focused backend-environment mobile tests, including config, runtime/orchestration,
  storage/reset/query, Settings control, and i18n parity. Run mobile `npx tsc --noEmit` and
  `npm run lint` when the focused merge surface requires their cross-file proof; record every
  command and result.
- [ ] 4.3 Start the documented isolated Postgres/Redis prerequisite with
  `bin/server-compose.sh`, run server `npm run generate:openapi`, then mobile
  `npm run generate`, and require zero unexpected diff in `openapi/openapi.json` or
  `mobile/src/api/generated/`. Confirm the complete source-health contract and all main-side
  generated additions remain; never hand-edit generated output.
- [ ] 4.4 Compare the integrated result with both parents and prove main's
  `mobile/app.config.ts`, `mobile/eas.json`, and `server/docker-compose.yml` contracts are
  retained. Prove integration-authored changes contain no `.github/workflows/`, migration,
  `mobile/firebase/`, credential/certificate, Terraform/Kubernetes, deploy, production-data,
  dependency, background-operation, unrelated-cleanup, or `app/` legacy Flutter edit.
- [ ] 4.5 Run `git diff --check`, strict validation with
  `openspec validate resolve-pr-273-fifth-current-main-integration --strict`, and final
  name-status/both-parent diff inspection. Record evidence for the ADR identity-only change,
  semantic union, generated-contract parity, and sensitive exclusions on this checklist.

## 5. OpenSpec closure and same-PR push

- [ ] 5.1 Mark completed tasks with exact evidence, archive this one-off change using
  `openspec archive resolve-pr-273-fifth-current-main-integration --skip-specs -y`, then run
  `openspec validate --all --strict`. Confirm the active change disappears from `openspec list`,
  the dated archive exists, prior archives are unmodified, and no canonical
  `openspec/specs/same-pr-fifth-current-main-integration/spec.md` is created.
- [ ] 5.2 Commit the integration/remediation with the required Paperclip co-author footer and
  push without force to the existing branch. Verify PR #273 remains the same open/non-draft PR,
  retains `run-e2e`, has the freshly integrated main SHA as an ancestor, and contains no
  replacement branch or PR.
- [ ] 5.3 Update the existing PR body—never open another PR—so Apply is complete and the ADR
  043/044 ownership, both Calendar contracts, Compose/backend-environment union, generated
  parity, sensitive exclusions, no-QA posture, and autonomous Reviewer-owned squash-merge route
  are accurate.

## 6. Exact-head CI proof and downstream handoff

- [ ] 6.1 Record the final pushed SHA and successful URLs for every required scheduled check at
  exactly that SHA, including image/build/server/web/mobile checks and fresh Android and iOS
  native E2E. Retain `run-e2e`; previous-head results do not satisfy this task and no check may
  be skipped, weakened, or optionalized.
- [ ] 6.2 Hand the same issue, branch, and PR to Simplifier for a fresh exact-head pass, then to
  Reviewer for a fresh exact-head verdict. Reviewer may squash-merge only after current-main
  ancestry, baseline scope, CI, Simplifier, and review gates are clean; no separate QA gate or
  deploy act applies. Propagate verbatim: “Samuel Prak authorizes Paperclip to finish PR #273
  end to end without further human approval.”
