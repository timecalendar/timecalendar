## 1. Lock the current surface contract

- [x] 1.1 Update the user-calendar screen test harness so controlled canonical rerenders and deferred `setVisible` promises are easy to express, while keeping the real theme, i18n, effective-name helper, platform helper, and existing data-hook boundary; verify the focused suite still proves all pre-refactor loading, empty, error, inset, add, fallback-name, menu, rename, delete, announcement, accessibility, and testID behavior before changing production modules.
- [x] 1.2 Add failing focused ordering cases for optimistic success before live-query echo, delayed acknowledgement, failed-write rollback to the latest canonical value, ignored rapid/repeated input during one pending write, acknowledgement followed by a later external canonical reversal, stale async completion, and row unmount/remount; verify each test fails for the intended missing or current effect-driven behavior without adding retries, longer waits, or weaker matchers.

## 2. Build the operation-keyed visibility controller

- [x] 2.1 Add a pure reducer/controller in `mobile/src/features/calendar-sources/ui/` whose operation records are keyed by calendar id and carry a monotonic operation id plus target; implement explicit start, success-awaiting-canonical, failure, canonical-acknowledgement, stale-completion, and release transitions, and verify the pure transition tests cover every branch.
- [x] 2.2 Hoist the controller to screen/list scope so virtualized row unmounts cannot discard an active operation; derive each switch value from the current id-keyed operation plus canonical calendar value, and verify the remount regression stays optimistic and issues no extra write.
- [x] 2.3 Preserve the per-calendar one-write-at-a-time guard: ignore every repeated or opposing switch event while that calendar's write is unresolved, release the guard on both success and failure, and accept later input only after release; verify controlled-promise tests assert exact repository call counts and arguments.
- [x] 2.4 Retire an operation synchronously when canonical state acknowledges its target, without the current passive state-reset effect and without mutating refs during render; verify a later external canonical reversal renders immediately with no stale optimistic flash.
- [x] 2.5 Guard all async completions by operation id so an old completion cannot clear or overwrite newer state; verify the stale-completion test settles promises out of order and retains the newest derived value.

## 3. Extract the row/menu and visibility presentation

- [x] 3.1 Extract `CalendarRow` into a focused internal `calendar-sources/ui` module that owns effective display name, personal subtitle fallback, row styling, and the two-action `MenuView`; verify its focused tests preserve exact Rename/Delete action data, destructive attribute, calendar-id testIDs, and rename/delete callbacks.
- [x] 3.2 Preserve Android's imperative menu `show()` behavior for press and the `activate` accessibility action, and preserve iOS's native self-open path without an imperative call; verify both platform branches with the existing exception-safe `usePlatform` helper.
- [x] 3.3 Extract `VisibilityControl` into a focused internal module that receives the controller-derived value and callback while preserving the native `Switch`, translated accessibility label/hint, calendar-id testID, large-font layout, theme track/thumb colors, and touch target; verify checked-state and font-scale behavior without duplicating controller state locally.
- [x] 3.4 Move styles to their owning modules and confirm `UserCalendarsScreen`, `CalendarRow`, and `VisibilityControl` are each materially below 200 lines; verify `wc -l` plus review that no extracted component hides multiple unrelated owners in one function.

## 4. Virtualize the screen composition

- [x] 4.1 Replace the populated `ScrollView` plus `calendars.map` with one React Native `FlatList`, using `calendar.id` as `keyExtractor` and the extracted row as `renderItem`; verify the component test observes a virtualized list and stable id keys with multiple calendars.
- [x] 4.2 Put the visibility description in `ListHeaderComponent` and preserve the existing list gap, normal bottom padding, and Android FAB clearance in `contentContainerStyle`; verify focused style assertions cover both platform padding branches and that the final list item is not assigned a positional key.
- [x] 4.3 Keep the unresolved-read blank state, centered loaded-empty state, `WriteErrorNotice`, safe-area horizontal inset calculation and max width, platform add affordance, Android FAB, and conditionally mounted rename dialog outside the list; rerun the complete screen suite and verify every existing behavior remains green.
- [x] 4.4 Preserve `mobile/src/features/calendar-sources/ui/index.ts` and the feature-level barrel exports, and keep every new import within the UI→data-sublayer/native-chrome boundaries; verify targeted import review and mobile lint enforce B-1, B-2, and B-6 with no new exception.

## 5. Architecture Book and OpenSpec alignment

- [x] 5.1 Update `docs/mobile/architecture-book/features.md` (or the existing topical user-calendar entry) to describe the current modular ownership, id-keyed `FlatList`, screen-owned optimistic controller, single-flight ordering, and unchanged event-source visibility seam; write current-state guidance rather than implementation history.
- [x] 5.2 Append a dated entry to `docs/mobile/architecture-book/CHANGELOG.md` for the reusable virtualization and optimistic-controller contract, and verify `calendar.md`, ADR 018, ADR 031, and ADR 044 remain accurate without amendment.
- [x] 5.3 Reconcile the accumulated `mobile-user-calendars` requirement with the shipped native `Switch` while archiving this delta, preserving all delete, rename, menu, accessibility, fallback-name, and write-error guarantees; validate that no stale checkbox-only wording contradicts the implemented surface.
- [x] 5.4 Record that no new ADR is required because the change does not alter storage, filtering, public interfaces, dependencies, or product behavior; if implementation discovers such a change, stop and return it to the Founding Engineer before expanding scope.

## 6. Focused and local-green verification

- [x] 6.1 Run focused Jest for every changed UI/controller suite in `mobile/` and record the exact natural-exit result; confirm the ordering tests use controlled promises/rerenders and no timeout increase or retry under ADR 044.
- [x] 6.2 Run `npx tsc --noEmit` and `npm run lint` from `mobile/`; verify typed translations, import sorting, accessibility rules, formatting, and calendar-sources boundary B-6 are clean with zero warnings.
- [x] 6.3 Run the full mobile Jest suite (`npm test`, and coverage form when required by the current gate) when practical; record whether each command exits naturally, and if the environment prevents a full run report the exact bounded failure without weakening tests.
- [x] 6.4 Run React Doctor from `mobile/` against the changed files using the current CLI, record the exact command and result, and classify every remaining finding as fixed, pre-existing, false positive, or accepted with evidence; do not add a suppression to hide the visibility-path try/finally bailout.
- [x] 6.5 Run `git diff --check` and inspect the complete branch diff; confirm no drift in `openapi/openapi.json`, `mobile/src/api/generated/`, `server/src/migrations/`, native/store/EAS/Firebase config, secrets paths, deploy/CI config, or legacy `app/`, and confirm no new dependency or translation change.

## 7. CI proof and Definition of Done

- [x] 7.1 Treat the focused controller/screen tests as the CI proof: demonstrate they fail if the list becomes eager, a second write starts while pending, success drops optimism before canonical echo, failure does not roll back, acknowledgement is not retired, a stale completion wins, remount loses state, or a later external canonical change is masked.
- [ ] 7.2 Push the implementation and verify the normal mobile CI checks at the exact branch head; fix any TypeScript, lint, Jest, coverage, generated-client drift, or disclosure failure before handoff, and report skipped path-gated jobs as skipped rather than green.
- [ ] 7.3 Walk the mobile Definition of Done: architecture/types/lint/tests/performance-by-virtualization/accessibility/i18n/native behavior/observability/documentation are complete or explicitly unchanged; native device QA and a new Maestro flow are N/A because this is a behavior-preserving refactor with existing selectors and no new user journey.
- [ ] 7.4 Before review handoff, re-run the disclosure/preflight controls and verify the diff remains limited to the OpenSpec change, calendar-sources UI/tests, and the required Architecture Book updates; sensitive surfaces remain none unless the scope audit proves otherwise.
