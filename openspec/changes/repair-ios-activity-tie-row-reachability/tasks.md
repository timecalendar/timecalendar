## 1. Bound the native Activity traversal

- [x] 1.1 In `mobile/.maestro/activity.yaml`, add a required
  `scrollUntilVisible`/`assertVisible` pair for
  `activity-new-e2e-activity-filler-025` immediately before the existing tie-higher traversal;
  retain the existing 60-second command budget and shared iOS/Android flow.
- [x] 1.2 Keep the existing required tie-higher, tie-lower, and older-anchor scroll/assert pairs in
  that order, with no optional command, retry, sleep, lowered visibility requirement, or deleted
  assertion.

## 2. Encode the regression and document the fixture

- [x] 2.1 Extend `mobile/e2e/activity-maestro-selectors.test.ts` with a focused source-contract test
  that proves the midpoint scroll/assert precedes tie-higher, which precedes tie-lower and the
  older-page anchor, and that all four observations remain non-optional.
- [x] 2.2 Update the Activity fixture section in `mobile/e2e/README.md` to explain that the stable
  midpoint bounds iOS traversal of the long virtualized first page while the unchanged tie pair and
  older anchor still prove ordering and real pagination.
- [x] 2.3 Architecture Book/ADR assessment: record this task as N/A because the change is a leaf
  native-flow proof repair with no reusable architecture contract change, and verify
  `docs/mobile/architecture-book/` remains untouched as required by scope.

## 3. Local green verification

- [x] 3.1 Run
  `cd mobile && npm test -- --runInBand e2e/activity-maestro-selectors.test.ts` and confirm the
  focused traversal/selector regression passes.
- [x] 3.2 Run `cd mobile && npm run lint` and confirm the shared flow support/test edits are clean.
- [x] 3.3 Run `openspec validate repair-ios-activity-tie-row-reachability` and confirm every proposal,
  design, delta-spec, and task artifact is valid.
- [x] 3.4 Inspect the final diff and confirm no sensitive surface, generated native output, app
  behavior, backend lifecycle, dependency, workflow, API contract, server migration, or legacy
  Flutter file changed.

## 4. Exact-head native CI proof and handoff evidence

- [x] 4.1 Add the existing `run-e2e` label to the draft PR so the unchanged
  `ci-mobile-e2e.yml` workflow runs against the implementation head; do not edit the workflow.
- [ ] 4.2 Confirm `Run mobile E2E (iOS)` succeeds on the exact implementation SHA with the midpoint,
  tie-higher, tie-lower, and older-anchor observations intact; record the SHA and direct successful
  job link in the PR and issue handoff.
- [ ] 4.3 Record the concurrently produced Android job result without making an Android-only change;
  any unrelated failure must remain visible rather than being skipped, optionalized, or retried.
- [ ] 4.4 Hand the exact-head green evidence to Reviewer; Reviewer sign-off plus green CI remains the
  verification path, with no separate QA gate.
