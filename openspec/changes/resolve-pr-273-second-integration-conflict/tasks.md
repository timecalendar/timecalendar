## 1. Same-branch integration preflight

- [ ] 1.1 Confirm the checkout is PR #273's existing head branch and the PR remains open and
      non-draft with `run-e2e`; fetch `origin/main` immediately before integration and record the
      exact head/base SHAs. Do not switch branches, open another PR, rebase, or force-push.
- [ ] 1.2 Run a fresh `git merge-tree --write-tree HEAD origin/main`, inventory every conflict
      and both-parent change, and verify ADR 043 is free. If the base moved and the conflict is no
      longer limited to additive integration plus ADR/reference bookkeeping, return the issue to
      Founding Engineering before editing.
- [ ] 1.3 Merge the recorded `origin/main` normally into the existing branch. Inspect all
      auto-merged sensitive and binding files before resolving the decisions-index conflict; do not
      touch `.github/workflows/` or weaken any accepted behavior or test.

## 2. Architecture Book identifier and semantic reconciliation

- [ ] 2.1 Retain main's `042-iphone-ipad-portrait-contract.md` byte-for-byte. Move
      `042-preserve-content-and-advise-source-recovery.md` to
      `043-preserve-content-and-advise-source-recovery.md`, change only its numeric H1, and prove
      the body below the H1 is unchanged from the pre-merge PR head.
- [ ] 2.2 Resolve `docs/mobile/architecture-book/decisions/README.md` from main's integrated
      table so ADR 042 and ADR 043 each appear once in numeric order with their unchanged summaries.
- [ ] 2.3 Update every live source-recovery ADR link/number, including
      `docs/mobile/architecture-book/calendar.md` and
      `docs/react-native-migration/inbox/2026-08-26-stale-source-recovery-device-checks.md`, to ADR 043. Do not rewrite the archived first-cycle OpenSpec record, which remains historical.
- [ ] 2.4 Inspect the auto-merged `calendar.md` against both parents and retain unchanged in
      substance both the PR's source-health/last-good advisory recovery guidance and main's server
      work-budget/cancellation/concurrency/retry/due-selection/hydration policy guidance.
- [ ] 2.5 Run repository-wide live-reference searches plus basename/H1/index checks to prove no
      active duplicate ADR number, stale live ADR 042 source-recovery link, broken link, or changed
      ADR substance remains. Record this required Architecture Book update in the task results; do
      not add unrelated chronology or rules.

## 3. Sensitive-surface preservation

- [ ] 3.1 Prove `git diff origin/main -- mobile/app.config.ts` is empty after integration and
      that main's ADR 042 remains unchanged. Do not author any edit to `mobile/app.config.ts`,
      `mobile/eas.json`, or `mobile/firebase/`.
- [ ] 3.2 Inspect `openapi/openapi.json` and `mobile/src/api/generated/` for the complete union of
      PR #273's source-health contract and every main-side addition, including required nullable
      dark-logo fields; use focused JSON/type assertions to make both sides explicit.
- [ ] 3.3 With the documented local services available, run server
      `npm run generate:openapi` and mobile `npm run generate`, then require no unexpected generated
      diff. Do not hand-edit generator-owned files.
- [ ] 3.4 Run the smallest existing server/mobile contract tests that prove the source-health
      and integrated main contracts remain connected, and inspect the final sensitive-surface diff
      for unrelated changes. Confirm no migrations, credentials/certificates, infrastructure,
      workflow, deploy, production-data, background-sync operation, or legacy Flutter edit was
      introduced by this cycle.

## 4. Local green and one-off OpenSpec closure

- [ ] 4.1 Run diff hygiene (`git diff --check` against the integrated base and final staged
      tree), inspect name-status/stat scope, and run focused semantic/reference checks from sections
      2–3. Record exact commands and results on these tasks.
- [ ] 4.2 Run
      `openspec validate resolve-pr-273-second-integration-conflict --strict`, complete every task
      with its evidence, and archive this operational change with
      `openspec archive resolve-pr-273-second-integration-conflict --skip-specs -y`; do not modify
      the archived first-cycle change or create a canonical remediation product spec.
- [ ] 4.3 Run `openspec validate --all --strict` after archival, confirm the active change is
      absent from `openspec list`, and verify the new dated archive exists with no
      `openspec/specs/same-pr-second-conflict-remediation/spec.md` created.

## 5. Exact-head CI and downstream gates

- [ ] 5.1 Commit the complete integration/remediation on the existing branch with the required
      Paperclip co-author footer and push without force. Verify PR #273 remains the same open,
      non-draft PR with the same named head branch, retains `run-e2e`, and becomes conflict-free
      after GitHub recomputes mergeability.
- [ ] 5.2 Record the final pushed SHA and successful URLs for every scheduled check at exactly
      that SHA: both server-image build jobs, web build, tests, Android native E2E, and iOS native
      E2E. Old-head results do not satisfy this task; do not skip, weaken, or optionalize a check.
- [ ] 5.3 Update the existing PR body—never create another PR—so Apply is marked complete and
      the second integration, ADR 043 reconciliation, dual `calendar.md` preservation, unchanged
      main native config, generated-contract union, sensitive exclusions, no-QA posture, and
      autonomous Reviewer-owned squash-merge route are accurate.
- [ ] 5.4 Hand the same issue, branch, and PR to Simplifier for a fresh exact-head pass, then to
      Reviewer for a fresh exact-head verdict. Reviewer may squash-merge autonomously only after a
      clean latest-PR preflight and all scope/CI/review gates pass; no deploy act follows from the
      merge authorization.
