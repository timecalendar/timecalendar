## Context

React Compiler is enabled for the Expo application, but React Doctor is not installed or exposed through `mobile/package.json`. Recent changes invoked either `@latest` or 0.9.13 with different flags and scopes, so results are not comparable and dependency analysis can escape the standalone mobile project boundary.

A fresh complete scan from `mobile/` with React Doctor 0.9.13, telemetry disabled, supply-chain analysis disabled, and no cache analyzed 493 source files and reported 93 diagnostics in 44 files: 5 errors and 88 warnings. The five errors are React Compiler unsupported-syntax bailouts at:

- `src/features/activity/ui/activity-screen.tsx`
- `src/features/calendar-sources/data/user-calendars/add-calendar.ts`
- `src/features/calendar-sources/data/user-calendars/rename.ts`
- `src/features/calendar/data/sync/sync.ts`
- `src/features/feedback/ui/feedback-screen.tsx`

All five involve `try` syntax that currently makes cleanup or failure-domain behavior explicit. The warning inventory includes 65 manual-memoization findings and 23 findings across 13 other rules. The implementation must treat these as hypotheses rather than a mechanical rewrite queue.

The repository root/web dependency graph is a different npm project. Running `npm ls next --all --json` from `mobile/` returns no Next dependency, and React Doctor's mobile project metadata reports `nextjsVersion: null`. The mobile workflow must make that boundary unambiguous instead of changing sibling dependencies to silence a misattributed report.

## Goals / Non-Goals

**Goals:**

- Make the React Doctor version, working directory, project, telemetry posture, dependency posture, and severity behavior reproducible.
- Leave the full existing diagnostic inventory visible and owned without making unrelated changes pay for old debt.
- Prevent new warnings and errors in changed mobile code from entering untriaged.
- Resolve compiler bailouts only when tests prove a behavior-preserving, clearer implementation.
- Produce final evidence that reconciles the historical 7-error/106-total baseline with the current 5-error/93-total baseline and the final result.

**Non-Goals:**

- Mass-remove manual memoization or chase a score.
- Suppress, ignore, downgrade, or reconfigure rules solely to make the report green.
- Change error recovery, observability, single-flight guards, dependency identity, accessibility, translations, testIDs, public feature barrels, or lint-enforced boundaries.
- Change root/web dependencies, production behavior, native/store configuration, API contracts, data schemas, deployments, OTA, or legacy Flutter.
- Reintroduce a separate QA stage for a tooling-only change.

## Decisions

## Decision 1 — Pin React Doctor inside the standalone mobile project

Add `react-doctor` as an exact `0.9.13` mobile devDependency and commit the resulting lockfile. Expose package scripts that invoke the local binary from `mobile/`; the canonical full scan explicitly targets `.` and disables telemetry/score and supply-chain analysis. The full scan is advisory (`--blocking none`) so it always produces the complete debt inventory.

An exact devDependency is preferred over repeated `npx @latest` calls because package installation, local runs, and CI then resolve the same locked package. An exact `npx` spec would pin the version but would still download outside the mobile lockfile and make the repository command dependent on npm resolution at every invocation.

Supply-chain analysis is disabled for this code-health command because the repository contains independent sibling package graphs and React Doctor previously attributed a sibling Next version to mobile. Dependency vulnerability gates remain owned by dependency-specific tooling. The diagnostic report records both `npm ls next` evidence and the React Doctor project metadata so disabling that scan cannot be mistaken for hiding a mobile dependency.

## Decision 2 — Split full advisory visibility from a changed-code blocking gate

Provide two stable entrypoints:

- a full mobile scan for audits and baseline refreshes, verbose and non-blocking;
- a changed-code scan relative to `origin/main`, with both warning and error severity blocking.

React Doctor's changed scope compares issue identities against the base, so a file with old findings can be edited without inheriting the existing debt, while a newly introduced finding fails. This is preferable to a checked-in suppression list or a whole-project warning gate, either of which would hide evidence or force unrelated work to clear 88 existing warnings.

The CI step will run after `npm ci` in `ci-mobile.yml`. The checkout step must fetch enough history for `origin/main` and its merge base to exist; the workflow test/proof must fail if the base cannot be resolved rather than silently scanning the wrong range. The workflow's triggers, generated-client check, TypeScript, lint, Jest, native E2E, and deployment behavior remain unchanged.

## Decision 3 — Keep a durable normalized classification report, not raw CLI JSON

Add a current-state report under `docs/mobile/` containing:

- React Doctor version and exact repository commands;
- scanned/affected/error/warning totals;
- every error as an individual row with path, rule/title, disposition, evidence, and owner;
- every warning covered by a per-rule cohort whose counts sum exactly to the warning total, with affected paths or an inventory reference, disposition, evidence, owner, and revisit trigger;
- before/after counts and the seven prerequisite PR/commit pairs;
- the standalone dependency proof for Next.

Raw React Doctor JSON is not committed because it embeds checkout-specific absolute directories and contains more environment detail than the repository needs. The normalized report must use repository-relative paths, reconcile its per-rule counts to the overall totals, and be updated in the same change whenever an implementation changes a finding. A generated report is optional; correctness is enforced by a focused repository test or validation script that checks the version/command contract and count reconciliation.

## Decision 4 — Preserve error semantics before compiler coverage

For each current bailout, first identify the semantic obligations already proved by tests: cleanup on rejection, pending-flag release, failure-domain separation, observability ownership, no-token early return, non-blocking Activity refresh, and duplicate-submit/single-flight prevention. Attempt the smallest local rewrite, then run the focused suite and React Doctor against that path.

A rewrite lands only when it removes the diagnostic and makes those obligations at least as explicit. If no such rewrite exists, retain the clear code and classify the diagnostic as an evidence-backed deferral with an owner and revisit trigger such as a React Compiler/Doctor upgrade. Moving `try` blocks around, converting them to promise chains, or extracting helpers merely to evade source analysis is rejected unless the resulting code is independently clearer and covered.

The implementation must also reconcile the two historical unsupported-syntax findings no longer present after prerequisite merges: identify the relevant merged changes and record that the fresh baseline, rather than copied historical output, contains five current errors.

## Decision 5 — Triage warning cohorts by semantic role

Every non-memoization warning is inspected at its reported location and classified as confirmed, false positive, fixed, or deferred with evidence and ownership. Representative manual-memoization validation must cover at least:

- a renderer/data projection where stable array or object identity prevents downstream work;
- a context or hook API where callback/value identity is part of dependency stability;
- an effect or subscription boundary where identity controls lifecycle behavior;
- a cheap/local memoization site that can be removed if it has no semantic or measured value.

The remaining manual-memoization findings may then be classified in evidence-backed cohorts by the same role, with all 65 occurrences accounted for. This avoids 65 low-value edits while still proving the deferral is intentional. Any memoization removal must have focused behavior or identity coverage and a clean changed-code scan.

## Decision 6 — Record the quality rule in the Architecture Book and an ADR

The full-advisory/changed-blocking split is a reusable, CI-enforced quality contract and therefore changes binding mobile guidance. Update the appropriate Architecture Book topical page(s), `CHANGELOG.md`, and add a conflict-free ADR after rechecking the decision index and open PR reservations. The ADR records why existing debt stays visible but non-blocking and why new changed-code findings block.

This is warranted because weakening or broadening the gate later affects every mobile change. The detailed diagnostic inventory remains in the separate `docs/mobile/` report so the Architecture Book stays current-state guidance rather than an implementation diary.

## Risks / Trade-offs

- **[React Doctor changes output or changed-scope semantics]** → Exact-pin 0.9.13, test the package scripts and comparison base, and require an explicit baseline/ADR review before upgrading.
- **[CI cannot resolve `origin/main` in a shallow checkout]** → Fetch full history (or the minimum proven equivalent) and include a script/workflow contract test that exercises the base-ref failure path.
- **[Existing findings become invisible]** → Keep the full advisory command and reconciled report mandatory; do not add suppressions or a full-scan success claim.
- **[Compiler cleanup changes user-visible failure behavior]** → Run focused rejection, cleanup, lifecycle, accessibility, and identity tests before accepting each rewrite; defer when clarity would regress.
- **[The warning report becomes an unauditable bucket]** → Require counts to reconcile exactly, paths/inventory references for every cohort, an owner, evidence, and a concrete revisit trigger.
- **[Workflow sensitivity expands accidentally]** → Limit `.github/workflows/ci-mobile.yml` to checkout history and one post-install Doctor step; inspect the diff for trigger, permission, native E2E, deploy, and secret changes.
- **[Raw tooling output discloses host-specific paths]** → Commit only normalized repository-relative evidence and run the disclosure preflight before every public write.

## Migration Plan

Land the exact dependency/scripts, normalized baseline, safe source/test cleanups, Architecture Book/ADR updates, and CI gate together. Run focused tests per changed behavior, then mobile TypeScript, lint, the full Jest suite with natural process exit, the full advisory scan, the changed-code scan, OpenSpec validation, and workflow contract verification. After push, require the existing mobile CI plus the new Doctor step to pass on the exact PR head.

Rollback is a repository revert. It removes the tool command and guard without changing runtime code, stored data, native artifacts, or production state; any behavior-preserving source cleanup can be reviewed independently during the revert.

## Open Questions

None. Exact command spelling may be adjusted during implementation only if React Doctor 0.9.13's committed package-script execution proves an equivalent flag order or output mode is required; the version, mobile-only boundary, no-telemetry posture, supply-chain exclusion, and blocking semantics are fixed.
