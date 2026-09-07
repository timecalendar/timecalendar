## 1. Establish the reproducible mobile command

- [x] 1.1 Add `react-doctor` as the exact `0.9.13` devDependency in `mobile/package.json`, regenerate `mobile/package-lock.json`, and verify the installed binary reports 0.9.13 after `npm ci`; do not use a range or `@latest`.
- [x] 1.2 Add a full-project package command that runs from `mobile/`, explicitly targets `.`, disables telemetry/score and supply-chain analysis, reports warnings verbosely, and uses advisory blocking; run it once and confirm the report identifies only the Expo mobile project.
- [x] 1.3 Add a changed-code package command that uses the same pinned binary and boundary, compares new findings with `origin/main`, and blocks on warning severity so both new warnings and errors fail.

## 2. Capture and reconcile the diagnostic baseline

- [x] 2.1 Run a fresh, cache-disabled full scan from the branch after dependency installation and record its complete scanned/affected/error/warning totals plus per-rule counts; reconcile the result with the proposal-time 493-file, 93-diagnostic baseline and the historical 461-file, 106-diagnostic baseline rather than copying either count forward.
- [x] 2.2 Add the normalized current-state React Doctor report under `docs/mobile/` using only repository-relative paths. Record the exact commands/version, one row per error, warning cohorts whose counts sum to the warning total, dispositions, evidence, owners, and concrete revisit triggers for every deferral.
- [x] 2.3 Record the seven prerequisite integrations as exact PR/merge-commit pairs (#369/`f8a01180`, #370/`859cbc54`, #371/`ada9f09a`, #372/`bc686ab9`, #373/`3209efa2`, #374/`7be6dbbf`, #376/`9a451566`) and identify which merged changes account for the two historical compiler errors no longer present in the fresh five-error inventory.
- [x] 2.4 From `mobile/`, run `npm ls next --all` and capture the empty result together with React Doctor's `nextjsVersion: null` mobile metadata; state explicitly that sibling root/web dependencies are outside the mobile graph and leave them unchanged.

## 3. Investigate the current compiler bailouts

- [x] 3.1 Inspect `activity-screen.tsx`'s load-older cleanup and single-flight obligations; attempt only a clearer compiler-supported local rewrite, run `activity-screen.test.tsx` including rejection/finalization coverage, and either remove the finding or record an evidence-backed deferral without suppression.
- [x] 3.2 Inspect `add-calendar.ts`'s pending/error cleanup across create, resolve, and durable upsert; run `add-calendar.test.tsx` for each failure boundary and either remove the finding with equivalent behavior or record a deferral.
- [x] 3.3 Inspect `rename.ts`'s recoverable request versus recorded local-write failure domains and pending cleanup; run `rename.test.tsx` for both domains and either remove the finding with equivalent behavior or record a deferral.
- [x] 3.4 Inspect `sync.ts`'s token-read/fetch/local-write/name-convergence domains, early returns, unawaited Activity refresh, and final syncing cleanup; run `sync.test.tsx` and the focused sync lifecycle tests and either remove the finding with all obligations intact or record a deferral.
- [x] 3.5 Inspect `feedback-screen.tsx`'s duplicate-submit guard and exception-safe ref release; run `feedback-screen.test.tsx` for success, rejection, and retry behavior and either remove the finding with equivalent behavior or record a deferral.
- [x] 3.6 Rerun React Doctor against every source file changed in 3.1–3.5, confirm no new warning or error was introduced, and update the normalized report immediately for every fixed or deferred result.

## 4. Classify the warning inventory

- [x] 4.1 Inspect and classify every non-memoization warning at its reported path as confirmed, fixed, false positive, or evidence-backed deferral; run focused tests for any source edit and account for all occurrences in the report without ignores or rule downgrades.
- [x] 4.2 Validate representative manual-memoization sites covering renderer/data identity, context or hook API stability, effect/subscription lifecycle, and a cheap local candidate; cite existing identity/behavior tests or add focused coverage before removing any memoization.
- [x] 4.3 Classify all remaining manual-memoization occurrences into evidence-backed semantic cohorts with affected-path inventories, owners, and revisit triggers; confirm the cohort counts sum exactly to the current rule count and do not mass-remove `useMemo`/`useCallback`.
- [x] 4.4 Run the full advisory command after warning work and verify every remaining diagnostic has a report disposition and no error-severity finding remains untriaged.

## 5. Add the changed-code CI guard

- [x] 5.1 Update `.github/workflows/ci-mobile.yml` only as needed to make `origin/main` and its merge base available and add one named post-install React Doctor changed-code step; preserve workflow triggers, permissions, codegen, TypeScript, lint, Jest, native E2E, deploy behavior, and secret handling.
- [x] 5.2 Add a focused config/contract regression test in the existing mobile test gate that proves the dependency pin, full and changed package-script flags, warning-level blocking, mobile-only path, and CI step/base-history wiring cannot drift silently.
- [x] 5.3 Using an intentionally introduced known warning in a disposable or inject-and-revert check, prove the changed command exits non-zero for a new finding and returns green after reverting it; also prove a pre-existing baseline finding alone does not fail changed scope. Leave no injected source or cache artifact in the diff.
- [x] 5.4 Review the sensitive workflow diff and confirm it contains only the checkout-history and named diagnostic-gate changes and does not affect production, native E2E, deployment, credentials, or unrelated jobs.

## 6. Record the binding mobile quality contract

- [x] 6.1 Recheck `docs/mobile/architecture-book/decisions/README.md` and open PRs for reserved ADR numbers, then add a conflict-free ADR for the full-advisory/changed-blocking strategy, its exact-version rule, the standalone dependency boundary, and its revisit conditions.
- [x] 6.2 Update the relevant Architecture Book lint/testing guidance and `CHANGELOG.md` with the current command and CI contract, linking to the executable package scripts/workflow and the separate diagnostic report; avoid implementation chronology or unrelated rule changes.

## 7. Local-green and final evidence

- [x] 7.1 Run every focused test named above plus the React Doctor config/contract test, and record exact passing commands and results for each changed behavior.
- [x] 7.2 From `mobile/`, run `npx tsc --noEmit` and `npm run lint`; resolve all errors and warnings without weakening existing architecture, translation, accessibility, testID, or import-boundary rules.
- [x] 7.3 Run the full mobile Jest suite with coverage and an external bounded watchdog, confirm all tests pass, and explicitly record that Jest exits naturally without forced termination or open-handle workarounds.
- [x] 7.4 Run the full advisory and changed-code React Doctor commands, confirm the full totals match the normalized report, the changed-code command is green, every warning is owned/classified, and no error is untriaged.
- [x] 7.5 Run `openspec validate make-mobile-react-doctor-actionable` and `git diff --check`; inspect the complete diff for debug/TODO artifacts, raw absolute tool output, disclosure, generated-client/OpenAPI drift, migrations, native/store config, secrets, deploy config beyond the declared workflow, legacy Flutter, and unrelated changes.

## 8. CI proof and handoff evidence

- [ ] 8.1 Push the implementation and confirm the existing mobile checks plus the named React Doctor step pass on the exact PR head; if the diagnostic step fails, classify or fix the finding rather than suppressing it or weakening blocking severity.
- [ ] 8.2 Update the PR body and issue evidence with before/after diagnostics, the seven prerequisite PR/commit pairs, focused tests, TypeScript, lint, full Jest natural exit, full/changed Doctor results, deliberate deferrals, Architecture Book/ADR changes, and the exact `.github/workflows/ci-mobile.yml` sensitive-surface review.
