## 1. Durable synchronization metadata

- [ ] 1.1 Add `notifications.sync.dirty` and `notifications.sync.generation` to `@/storage` known keys/classification as backend-bound values; add total boolean/non-negative-safe-integer reads and focused malformed/default/round-trip tests in the notification data layer.
- [ ] 1.2 Add synchronous notification intent helpers that advance generation and set dirty before a preference mutation, clear dirty only for a caller-validated acknowledgment, and remove both values for reset; verify ordering and safe-integer rollover with focused unit tests.
- [ ] 1.3 Route all three notification preference setters through dirty-before-write orchestration while retaining the existing total preference parsing/reactivity; add a crash-seam test where dirty marking succeeds and the preference mutation is interrupted.
- [ ] 1.4 Recreate storage modules/runtime in restart tests to prove dirty intent survives, canonical preferences remain the snapshot source, and no token/calendar/DTO/error/retry payload key exists.

## 2. Pure synchronization controller and transport

- [ ] 2.1 Define the immutable shared status union (`pending`, `waiting` with prerequisite reason, `error`, `acknowledged`) and implement `createNotificationSyncRuntime(dependencies)` with `subscribe/getSnapshot`, lifecycle commands, injected timers/active-state source, and sanitized error recording; verify subscription notification and disposal in `notification-sync-runtime.test.ts`.
- [ ] 2.2 Wrap the existing generated plain subscription PUT function in an injectable feature transport that forwards an AbortSignal through `customFetch`; prove URL/method/body/caller cancellation at the mutator seam without changing generated/OpenAPI files.
- [ ] 2.3 Implement readiness-aware current-snapshot assembly from imperative preferences, current token, effective locale/zone, and `{calendars, ready, revision}`; test missing token, unloaded calendars, and loaded-empty `calendarIds: []` separately.
- [ ] 2.4 Implement the serialized drain and latest-state coalescing: one active request, build-time identity recheck, and one next current snapshot after changes; use controlled promises to prove A→B edits never overlap client requests and never resend obsolete B intermediates.
- [ ] 2.5 Gate every completion and local side effect on captured generation plus live runtime epoch; use controlled success/failure orders to prove earlier acknowledgment cannot clear newer intent and stale failure cannot publish error, record, or retry.
- [ ] 2.6 Implement startup dirty backstop and dirty restart replay; prove a process recreated after failure or after mark-before-preference interruption builds the current complete DTO rather than a persisted request.
- [ ] 2.7 Implement active-only automatic retries at 1s, 5s, and 30s with no timers for missing prerequisites; fake-timer tests must prove retry exhaustion stops, dirty remains, background cancels scheduled work, and foreground/manual/input triggers reset the budget and rebuild current state.
- [ ] 2.8 Implement `dispose` and idempotent `resetForEnvironment` to advance epoch, abort transport, clear timers/subscribers/status and durable metadata; settle a controlled old request after each operation and prove it has no acknowledgment, error, diagnostic, or retry effect.

## 3. Single app-lifecycle owner and trigger migration

- [ ] 3.1 Replace `useNotificationRegistration` with one root runtime hook/component mounted inside the query provider in `mobile/src/app/_layout.tsx`, preserving the existing permission request order and cold-start behavior; root integration tests must assert one live runtime across child-route navigation.
- [ ] 3.2 Move the sole `onFcmTokenRefresh` listener into the root owner, update current token through generation invalidation, and remove the duplicate listener from `useNotificationPreferences`; verify one subscription and rotating-token latest-state retry.
- [ ] 3.3 Feed `useUserCalendarsSnapshot()` readiness/revision and membership into the owner, replacing the lossy `useUserCalendars()` DTO path; integration tests must hold while unloaded, PUT loaded-empty, and invalidate an active request on calendar changes.
- [ ] 3.4 Feed i18n `languageChanged`, the reactive effective display zone, AppState foreground transitions, and startup/manual triggers into the same runtime; retain explicit-zone device-change inertness and prove every trigger uses the sole transport owner.
- [ ] 3.5 Refactor `useNotificationPreferences` into reactive local preferences plus shared runtime status/Retry commands, with setters using dirty-before-write invalidation; remove generated mutation state and independent request lifecycle from all screen hooks.
- [ ] 3.6 Connect `resetNotificationRuntimeState` to the live runtime through the notifications data public API; extend environment switch ordering tests and a controlled integration test to prove timers/transport/metadata clear and an old-environment completion cannot affect target work.
- [ ] 3.7 Add a focused repository contract test that rejects notification-screen/generated mutation imports and more than one token-refresh subscription/request-owner site.

## 4. Shared screen status and localization

- [ ] 4.1 Update the existing notification settings screen to render shared pending, prerequisite-waiting, retryable-error, and acknowledged feedback without changing its native controls; show Retry only for retryable error and retain accessible alert/live-region semantics.
- [ ] 4.2 Add concise typed FR/EN strings that describe remote settings synchronization without claiming OS permission or push delivery; run the existing catalog parity/type proof.
- [ ] 4.3 Extend screen tests for pending/waiting/error/acknowledged states, Retry, and unmount/remount continuity using the shared runtime seam rather than a mocked TanStack mutation.

## 5. Integration and CI proof

- [ ] 5.1 Add a root-level integration suite that mounts the runtime and settings consumer, dismisses/remounts the route, rotates token, changes preference/locale/zone/calendars, and proves all activity reaches one serialized request source.
- [ ] 5.2 Add controlled reset-during-request and dispose-during-retry integration cases proving no old completion can clear new intent or arm a timer; assert diagnostics contain neither token, calendar IDs, payloads, nor request signatures.
- [ ] 5.3 Run the edited notification/storage/environment/screen suites directly and record the exact green commands and tested commit in the implementation handoff.
- [ ] 5.4 Make the controller race/restart/reset integration suite part of the ordinary Jest discovery path as the CI proof test; verify it fails when the generation or epoch acknowledgment guard is intentionally removed, then restore the guard.

## 6. Architecture Book and specification reconciliation

- [ ] 6.1 Update `docs/mobile/architecture-book/firebase.md` and `features.md` with the single notification-runtime owner, current-snapshot inputs, shared status, and permission/delivery boundary; point to approved D03 rather than adding a duplicate ADR.
- [ ] 6.2 Update `docs/mobile/architecture-book/storage.md` with dirty/generation-only persistence and backend classification, and `testing.md` with the controlled-promise/recreated-storage race proof pattern.
- [ ] 6.3 Add a dated `docs/mobile/architecture-book/CHANGELOG.md` entry for the ownership/recovery contract and verify all current-state prose avoids implementation chronology.
- [ ] 6.4 Reconcile implementation against the three delta specs and run `openspec validate reliable-notification-saves`; resolve every validation error before local green.

## 7. Verification and handoff

- [ ] 7.1 Run the full mobile local gate from `mobile/`: `npx tsc --noEmit`, `npm run lint`, and `npm test -- --coverage`; record exact results and ensure notification logic remains above the 90% logic threshold and the project above the 70% global floor.
- [ ] 7.2 Verify `git diff -- openapi/openapi.json mobile/src/api/generated mobile/firebase mobile/app.config.ts mobile/eas.json server/src/migrations .github/workflows app` is empty, confirming every declared sensitive/out-of-scope surface remains untouched.
- [ ] 7.3 Review final diagnostics and persisted-key inventory to confirm no FCM token, calendar identifier, request/response payload, or user data can be logged or stored by the runtime.
- [ ] 7.4 Record the owner-led device acceptance surfaces for pre-release review—understandable local-versus-remote status, navigation away/back, Retry, FR/EN, themes, large text, VoiceOver/TalkBack—without treating that D05 check as a repository merge gate or creating a separate ticket.
