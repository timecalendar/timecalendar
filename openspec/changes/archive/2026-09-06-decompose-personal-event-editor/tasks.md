## 1. Characterize lifecycle and selector contracts

- [x] 1.1 Extend `mobile/src/features/personal-events/ui/personal-event-form-screen.test.tsx` before extraction to pin blank create defaults, late edit prefill, typed-value preservation across unrelated rerenders, and a route `uid` change whose stale lookup cannot overwrite the current event; verify with the focused screen and form-hook suites.
- [x] 1.2 Inventory and retain every existing `personal-event-*` test ID, translated accessibility label/state, route export, and the sticky footer outside the `ScrollView`; verify the existing Maestro selector guard still resolves every selector without changing `mobile/.maestro/`.

## 2. Move feature-owned controls

- [x] 2.1 Move `color-swatch-picker.tsx` and its complete focused test from `mobile/src/components/` to `mobile/src/features/personal-events/ui/`, repoint the editor imports, and remove the obsolete global files; verify no production import remains at the old path.
- [x] 2.2 Move palette literals/default selection into a feature-owned non-component module such as `color-swatch-presets.ts`, update the picker and editor to import it, and keep the picker component module free of non-component value exports; verify swatch count, labels, selected state, and emitted `#RRGGBB` values in the moved suite.
- [x] 2.3 Move `date-time-field.tsx` and its complete focused test into `mobile/src/features/personal-events/ui/`, retaining its `@/components/chrome` import, compact Android dialog/dismiss behavior, inline iOS behavior, and device-zone/non-device-zone conversions; verify with the moved date/time suite and an import search showing no direct feature import of `@expo/ui`.

## 3. Decompose editor orchestration

- [x] 3.1 Reduce `personal-event-form-screen.tsx` to the route/edit-resolution boundary and introduce a private `PersonalEventEditor` that owns form values, validation errors, and save orchestration; use direct relative UI imports and sibling `form`/`data` sublayer barrels, never the personal-events self-barrel.
- [x] 3.2 Replace edit-prefill effect synchronization with a keyed initialized editor only if task 1.1 proves blank loading, late resolution, `uid` changes, stale request rejection, and unrelated rerenders preserve current behavior; otherwise retain the existing guarded microtask effect inside the smaller editor and record that choice in the task/PR evidence.
- [x] 3.3 Extract the ordinary title/date/color/location/description rendering into a typed `PersonalEventFields` component that receives values, errors, locale, display zone, and one update callback while preserving all labels, placeholders, selectors, multiline behavior, and validation-alert output.
- [x] 3.4 Extract the sticky error/save/delete footer into a typed `PersonalEventActions` component, preserving keyboard reachability, error precedence/copy, edit-only delete visibility, disabled accessibility state, selectors, and navigation triggers.
- [x] 3.5 Extract the delete phase/generation-token state machine as one feature-private UI hook, retaining Android cancelable `onDismiss`, iOS presentation-edge release and stale-callback invalidation, synchronous duplicate suppression, exactly-once success navigation, failure preservation, and retry; keep `useDeleteEvent` unchanged unless a failing test proves a contract gap.
- [x] 3.6 Keep every resulting React component materially below 200 lines (target roughly 100–180 where cohesive), preserve the `PersonalEventFormScreen` and list exports in the UI/root feature barrels, and verify there is no feature self-barrel cycle.

## 4. Preserve behavior with focused CI proofs

- [x] 4.1 Reorganize or extend the screen-level component suite so it remains the CI proof across the composed editor for create, edit/prefill, validation, date/time change, color selection, successful save navigation, and visible save failure without replacing real validation/build helpers with mocks.
- [x] 4.2 Preserve callback-level delete coverage for alert opening, Cancel, Android dismissal, iOS duplicate-prompt invalidation/reopen, pending duplicate suppression, disabled accessibility state, exactly-once success, failure without navigation, populated-value preservation, and successful retry.
- [x] 4.3 Run all changed focused suites in one Jest invocation with `--runInBand`, including the screen/editor, moved swatch/date-time controls, and `form/{build,validate,hooks}.test.ts`; fix behavior regressions without weakening assertions or extending async timeouts.
- [x] 4.4 Run `mobile/e2e/maestro-selectors.test.ts` as the CI selector proof and confirm the existing personal-events Maestro YAML remains unchanged; do not add `run-e2e` or claim simulator execution for this behavior-preserving refactor on the no-KVM host.

## 5. Architecture Book ownership update

- [x] 5.1 Update `docs/mobile/architecture-book/features.md` (and the smallest directly relevant current-state pointer if needed) to record that the personal-events feature owns its editor controller, UI sections, color picker/presets, and date/time field while continuing to reach native date/time controls through the shared chrome seam.
- [x] 5.2 Add a concise `docs/mobile/architecture-book/CHANGELOG.md` entry for the ownership/decomposition update; explicitly record that ADR 014 is applied unchanged and that no new Architecture Book rule or ADR was introduced.
- [x] 5.3 Confirm the final diff excludes all expected sensitive surfaces: `openapi/openapi.json`, `mobile/src/api/generated/`, `server/src/migrations/`, mobile native/store/EAS/Firebase config, infrastructure/workflows, and legacy Flutter `app/`; if implementation unexpectedly reaches one, update the proposal/PR brief before handoff.

## 6. Local-green and React Doctor evidence

- [x] 6.1 Format every changed source, test, documentation, and OpenSpec file, then run `cd mobile && npx tsc --noEmit` and `npm run lint` with zero warnings.
- [x] 6.2 Run the full mobile Jest suite when practical, capture its exit status, and state whether the Jest process exited naturally; if it cannot be completed, record the concrete environment/runtime evidence rather than claiming green.
- [x] 6.3 Run React Doctor with no cache/telemetry against every changed React source file. Require `no-giant-component` to disappear for `PersonalEventFormScreen` and `only-export-components` to disappear for the swatch picker; list every remaining finding with rule, file, and evidence. In particular, determine whether the baseline compiler `todo` for `try/finally` and the loading-reset warning persist after the delete extraction, and fix genuine defects without suppressions while classifying tool limitations or intentional success-navigation state with evidence.
- [x] 6.4 Run `openspec validate decompose-personal-event-editor --strict`; ensure every completed implementation task is checked and use the screen/moved-control/selector suites as the PR's CI proof tests.
- [x] 6.5 Push implementation commits to the existing branch and update the single draft PR body to mark apply complete with exact focused/full/type/lint/React Doctor results, natural-exit status, prefill decision, Architecture Book update, sensitive-surface status, and no native-E2E claim; re-read the PR body after writing it.
