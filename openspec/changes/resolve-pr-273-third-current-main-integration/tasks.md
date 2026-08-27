## 1. Same-PR current-main preflight

- [ ] 1.1 Confirm the checkout is PR #273's existing named head branch and the PR remains open,
      non-draft, unmerged, and labeled `run-e2e`; fetch `origin/main` immediately before
      integration and record exact head/base SHAs. Do not switch branches, open another PR,
      rebase, force-push, or merge the PR.
- [ ] 1.2 Run a fresh `git merge-tree --write-tree HEAD origin/main`, inventory textual conflicts
      plus every both-parent or sensitive change, and compare the result with the proposal's
      observed contact/tracer scope. If fresh main adds a non-additive conflict, undecided
      contract choice, or new sensitive surface, return the issue to Founding Engineering.
- [ ] 1.3 Merge the recorded `origin/main` normally into the existing branch. Inspect all
      auto-merged contract, localization, Architecture Book, OpenSpec, and generated files even
      when Git reports no conflict; do not touch `.github/workflows/` or weaken accepted behavior.

## 2. Semantic contract and Architecture Book union

- [ ] 2.1 Compare both parents and preserve all source-health models, response fields, last-good
      content, advisory recovery, ADR 043 references, and both Calendar contracts from PR #273;
      prove ADR 042 and ADR 043 remain unique and unchanged in substance.
- [ ] 2.2 Integrate the current-main Architecture Book update for contact 503 retry/privacy
      behavior while retaining source-recovery and Calendar guidance. Verify `data.md`,
      `features.md`, `calendar.md`, the decision index, and applicable changelog entries describe
      the complete current state without adding integration chronology or changing a rule.
- [ ] 2.3 Preserve current-main contact behavior end to end: 201 success, documented 400
      validation and static 503 unavailability, bounded delivery metrics, payload redaction,
      retained/retryable feedback form values, and equivalent EN/FR not-sent copy. Verify the
      portable tracer declaration remains the accepted current-main implementation.
- [ ] 2.4 Preserve the canonical and archived OpenSpec union from both parents. Prove the two
      prior PR #273 integration archives and current-main contact/tracer archives remain present
      and unmodified; resolve only path-level additions required for this third active change.

## 3. Sensitive-surface and generated-contract proof

- [ ] 3.1 Prove `git diff origin/main -- mobile/app.config.ts` is empty after integration and
      main's ADR 042 remains unchanged. Do not author edits to `mobile/eas.json`,
      `mobile/firebase/`, native credentials/certificates, migrations, infrastructure, deploy
      configuration, background-sync operations, or `app/` legacy Flutter.
- [ ] 3.2 Assert the integrated `openapi/openapi.json` and `mobile/src/api/generated/` contain the
      complete union: source-health types/fields plus contact 201/400/503 responses and generated
      `ErrorType<void>`. Assert both EN/FR catalogs contain source-recovery and contact-retry keys
      with typed parity; never hand-edit generator-owned output.
- [ ] 3.3 With documented local services available, run server `npm run generate:openapi` then
      mobile `npm run generate`, inspect any output, and require no unexpected generated drift.
- [ ] 3.4 Run the smallest existing server/mobile suites proving source-health and contact
      controller/service/client, generated mutation, feedback retry/privacy, API mutator
      redaction, and locale behavior. Record exact commands and results; no real contact message
      or production operation is permitted.

## 4. Local green and one-off OpenSpec closure

- [ ] 4.1 Run `git diff --check`, inspect final name-status/stat and both-parent sensitive-surface
      diffs, and prove no workflow, migration, secret/certificate, infrastructure, deploy,
      production-data, background-operation, or Flutter edit was authored by this cycle.
- [ ] 4.2 Run `openspec validate resolve-pr-273-third-current-main-integration --strict`, record
      the Architecture Book, local-green, semantic-union, and generated-drift evidence on this
      checklist, then archive with
      `openspec archive resolve-pr-273-third-current-main-integration --skip-specs -y`.
- [ ] 4.3 Run `openspec validate --all --strict` after archival, confirm the active change is
      absent from `openspec list`, verify its dated archive exists, and prove no canonical
      `openspec/specs/same-pr-third-current-main-integration/spec.md` was created.

## 5. Exact-head CI and downstream gates

- [ ] 5.1 Commit the integration/remediation with the required Paperclip co-author footer and
      push without force to the existing branch. Verify PR #273 remains the same open/non-draft
      PR, retains `run-e2e`, and has current `main` as an ancestor after GitHub recomputes state.
- [ ] 5.2 Update the existing PR body—never open another PR—so Apply is complete and the third
      integration's contact/tracer union, source-health preservation, unchanged native config,
      sensitive exclusions, no-QA posture, and autonomous Reviewer-owned squash-merge route are
      accurate.
- [ ] 5.3 Record the final pushed SHA and successful URLs for every required scheduled check at
      exactly that SHA, including server images, web build, tests, Android native E2E, and iOS
      native E2E. Retain `run-e2e`; old-head results do not satisfy this task and no check may be
      skipped, weakened, or optionalized.
- [ ] 5.4 Hand the same issue, branch, and PR to Simplifier for a fresh exact-head pass, then to
      Reviewer for a fresh exact-head verdict. Reviewer may autonomously squash-merge only after
      the latest PR preflight, ancestry, scope, CI, and review gates are clean; no separate QA gate
      or deploy act applies.
