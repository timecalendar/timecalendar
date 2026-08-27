## 1. Same-branch integration preflight

- [x] 1.1 Confirm the checkout is PR #273's existing branch, fetch current `origin/main`, record
  its exact SHA, and verify `042` is still the next free ADR number. If the branch/PR identity
  changed, ADR 042 is occupied, or the conflict expanded beyond additive integration and ADR
  bookkeeping, stop and return to Founding Engineering without creating another branch or PR.
  - Result: PR #273 head branch matched the checkout at `cb1825cc7e7e57709e8e0dab6278284011d3fcc7`;
    fetched `origin/main` at `5b8a09db5db7e1ca0baa11c6bb07ad4cdd436d9c`; ADR 042 was free
    and next after main's ADR 041; `git merge-tree` showed only the expected decisions-index and
    additive generated-contract overlap.
- [x] 1.2 Merge the recorded `origin/main` into the existing branch without rebasing or force
  pushing; inspect every conflict and the auto-merged `openapi/openapi.json` and
  `mobile/src/api/generated/` files before resolving the decisions-index conflict.
  - Result: `git merge --no-ff --no-edit origin/main` produced only the expected
    `decisions/README.md` conflict. The OpenAPI and Orval schema files auto-merged with both
    `imageUrlDark` and the complete source-health contract present.

## 2. Architecture Book ADR reconciliation

- [x] 2.1 Retain main's `041-school-logo-theme-variants.md`; move
  `041-preserve-content-and-advise-source-recovery.md` to
  `042-preserve-content-and-advise-source-recovery.md` and update only its numeric H1.
  - Result: retained main's ADR 041 verbatim; renamed source recovery to ADR 042 and verified
    its content below the H1 is byte-for-byte unchanged from pre-merge head `cb1825c`.
- [x] 2.2 Reconcile `docs/mobile/architecture-book/decisions/README.md` from the integrated
  main table so ADRs 041 and 042 each appear once, in numeric order, with their unchanged
  decision summaries.
  - Result: resolved the sole conflict from main's table and appended unique ordered ADR 041
    school-logo and ADR 042 source-recovery entries.
- [x] 2.3 Update the source-recovery ADR link/number in
  `docs/mobile/architecture-book/calendar.md` and
  `docs/react-native-migration/inbox/2026-08-26-stale-source-recovery-device-checks.md`.
  Search the Architecture Book changelog and update it only if it contains a stale rule
  reference; do not add implementation chronology.
  - Result: updated both links to ADR 042. The changelog's ADR 041 reference describes the
    school-logo decision and was correctly left unchanged.
- [x] 2.4 Run repository-wide searches for the old source-recovery filename/title and ADR 041
  references, inspect all `decisions/[0-9][0-9][0-9]-*.md` basenames/headings, and prove there
  is no stale link, duplicate active ADR number, or changed ADR substance.
  - Result: `rg` found no stale source-recovery 041 link outside the operational OpenSpec
    history; basename/H1 checks emitted no mismatch or duplicate number; the ADR body diff
    excluding its H1 was clean.

## 3. Additive contract preservation

- [x] 3.1 Inspect the integrated OpenAPI document and assert `SchoolForList` and `SchoolForSeo`
  retain required nullable `imageUrlDark`, while `CalendarWithContent` retains required
  `sourceHealth` and the complete `CalendarSourceHealthDto` enum shape.
  - Result: a Node JSON assertion passed for both required nullable dark-logo fields, required
    `CalendarWithContent.sourceHealth`, and all four source-health enum/nullability shapes.
- [x] 3.2 With the documented local services available, run the server OpenAPI generator and
  require no unexpected contract diff; then run the mobile Orval generator and require no
  unexpected `mobile/src/api/generated/` diff. Generated artifacts must not be hand-edited.
  - Result: after `npm run db:migrate && npm run db:seed`, server `npm run generate:openapi`
    and mobile `npm run generate` succeeded; `git diff --exit-code` found no post-generation
    drift in OpenAPI or generated mobile output.
- [x] 3.3 Run the smallest existing server/mobile contract or generated-hook checks needed to
  prove both school-logo and source-health additions remain connected; inspect the final
  sensitive-surface diff for unrelated contract churn.
  - Result: 3 focused server suites passed (16 tests) and 2 focused mobile suites passed
    (12 tests). Generated TypeScript searches confirmed both nullable dark-logo fields,
    `CalendarSourceHealthDto`, and required `sourceHealth`; no unrelated generated drift exists.

## 4. Local green and OpenSpec closure

- [x] 4.1 Run `git diff --check origin/main...HEAD`, verify the integration-only file changes,
  and confirm no migrations, native/store config, credentials, infrastructure/workflow,
  deploy, production-data, or legacy Flutter changes were introduced by remediation.
  - Result: pre-commit `git diff --check origin/main` passed. The name-status review against
    fetched main contained the existing stale-source feature plus ADR/reference bookkeeping;
    no remediation-added migration, native/store config, credential, workflow, deploy,
    production-data, or legacy Flutter path was present. The committed-head triple-dot check is
    repeated after the merge commit.
- [x] 4.2 Run `openspec validate resolve-pr-273-integration-conflict --strict`, mark every task
  complete with exact commands/results, and archive this one-off operational change using
  `openspec archive resolve-pr-273-integration-conflict --skip-specs -y` before the final push.
  - Result: strict change validation passed; this task record was completed before running the
    required one-off archive command with `--skip-specs`, while the remaining post-archive and
    exact-head evidence tasks stay open until their gates complete.
- [x] 4.3 Run `openspec validate --all --strict` after archival, confirm the active change is
  absent from `openspec list`, and verify the archived artifacts are present while no
  `same-pr-conflict-remediation` canonical product spec was created.
  - Result: `openspec validate --all --strict` passed all 69 items; `openspec list --json`
    omitted the archived change; the dated archive is present and
    `openspec/specs/same-pr-conflict-remediation/spec.md` is absent as required.

## 5. Exact-head CI and pipeline handoff

- [ ] 5.1 Commit the complete integration/remediation on the existing branch with the required
  Paperclip co-author footer, push without force, and verify PR #273 still has the same head
  branch, remains non-draft, retains the `run-e2e` label, and reports no merge conflict after
  GitHub recomputes mergeability.
- [ ] 5.2 Record the pushed exact SHA and all six successful scheduled check URLs for that SHA:
  both build-image jobs, web build, tests, Android native E2E, and iOS native E2E. Previous-head
  green results do not satisfy this task; do not weaken, skip, or optionalize tests.
- [ ] 5.3 Update the existing PR body so Apply is ✅ and the integration, sensitive contract
  union, ADR 042 renumber, verification, no-QA posture, and Tier H human squash-merge route are
  accurate. Then hand the same issue/branch/PR to Simplifier for a fresh exact-head pass; after
  Simplifier, Reviewer must issue a fresh exact-head verdict before control returns to the CEO.
