## 1. Deterministic real-server Activity fixture

- [ ] 1.1 Extend the `NODE_ENV=test` seed behind `seedE2eCalendar(dataSource)` with fixed-ID
  `e2e-activity-baseline` and `e2e-activity-calendar` calendars and deterministic current content;
  keep `syncPlannedAt` in the future so neither calendar reaches a live iCal feed.
- [ ] 1.2 Seed one older baseline log and exactly 52 newer logs covering stable new, changed, and
  cancelled items, 46 deterministic fillers, a fixed-UUID same-timestamp pair at positions 50/51,
  and an older-page anchor; force exact relative `createdAt`/`updatedAt` values and make reruns
  idempotently restore the fixture.
- [ ] 1.3 Add a server Jest integration test that runs the real seed and HTTP v1 search, then proves
  the baseline page, `unreadCount: 52`, 50-row first page, following-page completion, cross-page
  descending-ID tie order without duplicates, token omission, and repeat-seed restoration.
- [ ] 1.4 Prove the seed stayed additive: existing smoke/rename calendar assertions remain green,
  normal non-test seeding gains no Activity rows, and `openapi/openapi.json`, generated clients,
  migrations, `ci/e2e-server.sh`, and workflows have no diff.

## 2. React Native integration proofs

- [ ] 2.1 Add an offline-restart integration test using the stateful `createFakeDb`: store a real
  Activity page, reset the Activity modules while preserving the fake disk, reject the mutator
  request, mount the real screen/data path, and assert cached history plus the cached-failure state
  render with no successful network request.
- [ ] 2.2 Add a calendar-removal integration test that seeds two calendars' rows through the real
  Activity repository, drives a loaded two-calendar → one-calendar transition through the real
  ownership-prune hook, and asserts only the removed history disappears while every Activity-state
  field remains unchanged. Do not mock `pruneToHeldCalendars` in this proof.

## 3. Selector-safe Activity Maestro journey

- [ ] 3.1 Add nested Activity-only import subflows: the baseline import clears state and waits for
  sync; the newer-calendar import preserves state and waits for sync. Keep them below
  `mobile/.maestro/activity/` so the lexical top-level harness does not run setup fragments alone.
- [ ] 3.2 Add top-level `mobile/.maestro/activity.yaml`: establish and positively observe the
  baseline read watermark, import the 52-row calendar, wait for the exact Settings unread accessible
  name, open Activity, then reopen Settings and prove that same unread name cleared while the row
  remains visible.
- [ ] 3.3 Extend the flow to activate new and changed rows by stable testID and assert unique real
  details, then tap the cancelled row and prove the Activity list remains active and cancelled
  details did not render. Use no Maestro `back` command and no vacuous negative assertion.
- [ ] 3.4 Extend the flow with a native pull gesture and a positive retained-first-page assertion,
  then `scrollUntilVisible` the lower-ID boundary/older-page anchor that cannot exist in the first
  response. Positively observe both members of the same-timestamp pair during the journey.
- [ ] 3.5 Add only the minimum stable testID needed by the native hierarchy; for every added ID add
  a colocated component assertion and include it in a static selector proof. Run Maestro syntax
  checks across every top-level and nested YAML and preserve one cross-platform selector path.

## 4. Architecture Book and operator documentation

- [ ] 4.1 Update `docs/mobile/architecture-book/testing.md` with the two-stage Activity fixture,
  real-server assertions, selector-safety rules, and no-KVM/native-CI boundary; append the matching
  dated entry to `docs/mobile/architecture-book/CHANGELOG.md`.
- [ ] 4.2 Update `mobile/e2e/README.md` with the Activity fixture tokens, staged import rationale,
  focused-flow command/debug guidance, deterministic 50/older-page boundary, and repeat-run reset
  behavior.
- [ ] 4.3 Add a self-contained `(HUMAN: Activity real-device verification)` note under
  `docs/react-native-migration/inbox/` with prerequisites, supported seed/lifecycle commands,
  foreground and push payload cases for iOS/Android, badge/timeline expectations, iPhone/iPad
  portrait/Android scrolling checks, accessibility/large-text checks, and a result table. State
  that this physical-device evidence never blocks the PR.

## 5. Local-green verification

- [ ] 5.1 Run the focused server seed/HTTP integration test against the supported worker-isolated
  Postgres setup and record its exact command/result.
- [ ] 5.2 Run the focused Activity restart, removal, screen, lifecycle, and selector tests; then run
  `cd mobile && npx tsc --noEmit` and `npm run lint`.
- [ ] 5.3 Run `cd mobile && npm test -- --coverage`; keep the Activity logic above the 90% gate and
  the global suite above 70%, with no weakened matcher or timeout.
- [ ] 5.4 Run the E2E wrapper shell proofs and `maestro check-syntax` for every committed YAML. If
  Maestro syntax checking cannot run, record the exact environment blocker rather than claiming it.
- [ ] 5.5 Regenerate/check the committed OpenAPI and mobile client only as a drift proof, and confirm
  both produce no diff because this change adds no API contract.

## 6. CI proof and handoff evidence

- [ ] 6.1 Confirm the new server integration test is discovered by the existing server CI test job
  and the new mobile integration/static tests are discovered by `test-mobile`; no new workflow step
  or `--passWithNoTests` escape is allowed.
- [ ] 6.2 Update the PR body and [TIM-400](/TIM/issues/TIM-400) handoff with the exact local commands
  that passed and the native truth: Maestro was **not run on this no-KVM host** unless a real device
  run actually occurred. Do not add the `run-e2e` PR label; identify the post-merge `main` iOS and
  Android jobs as the definitive native simulator/emulator proof.
