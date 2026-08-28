## Context

`mobile/.maestro/feedback.yaml` clears application state, waits for the Settings tab, taps
it, and immediately waits for `settings-feedback`. On the failing Android exact head, the
Settings screen remained at its initial top position and the Feedback row was below the
viewport, so the selector wait timed out. PR #273's environment-switch recovery already
establishes the compatible local pattern: a downward `scrollUntilVisible` with a 60-second
bound before retaining the selector's existing explicit wait and tap.

This recovery starts from current `origin/main` on a dedicated TIM-263 branch. It must not
modify or absorb PR #273, and it must not change application behavior, Settings layout,
Feedback form behavior, Maestro retry classification, flow order, or CI workflow files.
The host has no KVM, so native behavior can be proven only by the recovery PR's exact-head
Android and iOS jobs.

## Goals / Non-Goals

**Goals:**

- Make the Feedback flow reveal its Settings row deterministically on both viewport sizes.
- Preserve the existing navigation and mail-safe empty-form validation proof after the tap.
- Encode the critical YAML order and bounds in a focused off-device regression test.
- Require baseline CI plus both native E2E jobs on the recovery PR's exact head before merge.

**Non-Goals:**

- Change any Settings or Feedback application source, selector, copy, route, or layout.
- Add retries, reorder flows, change the harness runtime, or edit a workflow.
- Revisit the archived environment-switch repair or unrelated event-checklist/iOS-driver
  failures.
- Touch API/generated contracts, schema migrations, native/store/EAS/Firebase config,
  deployment infrastructure, or legacy Flutter.

## Decision 1 — Mirror the bounded Settings-row reveal pattern

Insert one `scrollUntilVisible` immediately after tapping Settings and before the existing
`extendedWaitUntil` for `settings-feedback`. Its element is the existing platform-neutral
test ID, direction is `DOWN`, and timeout is `60000`, matching the proven environment-switch
shape on PR #273. Keep the existing visibility wait because it provides a clear readiness
boundary before the selector tap; keep every command after the tap byte-for-byte unchanged.

Alternatives rejected:

- Tap the row without scrolling: repeats the failing assumption that it starts in-view.
- Use coordinates or localized row text: less stable across platforms, viewport sizes, and
  locales than the existing test ID.
- Add a blanket retry or change row order: broadens a leaf navigation repair into harness or
  product behavior and can mask real assertion failures.

## Decision 2 — Extend the focused harness proof without changing the harness

Add assertions to `mobile/e2e/test_run_e2e.sh` (or an equivalently focused shell proof under
`mobile/e2e/`) that inspect the committed Feedback YAML. The proof must fail if the selector,
downward direction, 60-second bound, or reveal-before-wait-before-tap order changes, and it
must lock the post-tap Feedback title, empty submit, and both validation assertions. Run
Prettier against the flow for YAML formatting and run the existing fake-Maestro harness test.

This keeps the regression in the E2E harness surface and lets existing baseline/native CI
exercise it without editing `.github/workflows/ci-mobile-e2e.yml`. It deliberately does not
parse or execute the app on this host.

Alternatives rejected:

- Rely only on visual review of five YAML lines: does not encode the order that caused the
  regression.
- Add a UI component test: application navigation already has selector/route coverage and
  cannot prove Maestro command ordering.
- Introduce a YAML dependency: disproportionate for one stable flow-shape assertion.

## Decision 3 — Treat native exact-head CI as the merge proof

After implementation is pushed, the recovery PR receives its native E2E trigger and is not
mergeable until the baseline checks and both `e2e-mobile-android` and `e2e-mobile-ios` jobs
are green for the current PR head. The Reviewer rechecks the head SHA and job conclusions
immediately before merge. A later commit invalidates earlier native evidence and requires a
fresh exact-head run.

This is a ticket-specific CI proof, not a workflow or Architecture Book policy change. The
existing Architecture Book already states that native proof belongs on simulator-capable CI;
therefore no ADR or binding documentation change is warranted for this leaf repair.

## Risks / Trade-offs

- [The row never renders] → `scrollUntilVisible` remains bounded and fails instead of looping;
  the retained explicit wait/tap keeps the selector boundary visible in diagnostics.
- [A static structure test becomes coupled to intentional flow edits] → assert only the
  regression-critical navigation block and unchanged mail-safety tail, with readable failure
  messages.
- [Native jobs pass on an obsolete commit] → Reviewer compares the recorded job SHA with the
  PR head immediately before merge and reruns both jobs after any new commit.
- [The recovery accidentally expands into PR #273 or sensitive files] → final diff audit must
  contain only OpenSpec artifacts, the Feedback flow, and focused E2E proof coverage.

## Migration Plan

1. Add the bounded reveal step and focused structural proof on the dedicated recovery branch.
2. Run YAML formatting, the focused shell/harness proof, and OpenSpec validation locally.
3. Push to the existing draft recovery PR and run baseline plus both native jobs on its exact
   head; Reviewer merges only after all are green.
4. Roll back with a normal revert if needed. No data, API, native binary, or user migration is
   involved. After merge, Founding Engineering separately re-coordinates TIM-239 / PR #273.

## Open Questions

None. The selector, direction, timeout, unchanged validation tail, and CI gate are fixed by
the issue evidence and established repository precedent.
