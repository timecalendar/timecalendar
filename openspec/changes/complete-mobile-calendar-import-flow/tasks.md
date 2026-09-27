## 1. Coordinate calendar sync outcomes

- [x] 1.1 Extract one calendar-sync pass that reads the durable token snapshot, fetches, maps, transactionally replaces events, triggers Activity refresh, converges names, and returns a discriminated outcome without changing current observability rules.
- [x] 1.2 Add the module-level serial coordinator for ordinary join and coalesced `freshAfterCurrent` behavior, including a test reset through the established test-module pattern.
- [x] 1.3 Prove with deferred-request tests that ordinary triggers join, a fresh trigger runs after success or failure, its pass rereads tokens, and no older response can replace events after it.
- [x] 1.4 Adapt `useSyncCalendars` to expose the operation outcome while preserving `isSyncing`, existing `isError` semantics, zero-token behavior, name-warning behavior, and all startup/Home/Calendar/notification consumers.
- [x] 1.5 Extend sync tests for valid empty responses, event-write failure, events-ready-with-stale-name metadata, one Activity refresh per committed pass, and no regression to last-good offline rows.

## 2. Make calendar identity persistence checkpoint-aware

- [x] 2.1 Refactor the shared add-calendar operation into attempt-bound create, token-resolve, and durable-upsert checkpoints with synchronous duplicate exclusion.
- [x] 2.2 Make Retry resume the first incomplete checkpoint and make a materially new source reset the abandoned checkpoint without persisting URL, token, DTO, or raw error state.
- [x] 2.3 Preserve the current generated-client/data-layer boundaries and exact Firebase recording policy while exposing durable completion to QR and iCal controllers.
- [x] 2.4 Add focused tests asserting create/resolve/upsert call counts for every failure and retry boundary, concurrent Retry exclusion, new-attempt reset, unmount safety, and exactly-once durable completion.

## 3. Add the root calendar-import result

- [x] 3.1 Add a thin `/calendar-import-result` route and register it as a headerless root Stack sibling above the existing `(tabs)` anchor under the route-inventory contract.
- [x] 3.2 Implement the result controller so mount and Retry request `freshAfterCurrent` exactly once per invocation and classify no-token/pre-commit failure separately from events-ready outcomes.
- [x] 3.3 Build readable, theme-safe loading, recoverable-error, and terminal-success views with polite/alert announcements, platform-sized controls, and no private route parameters.
- [x] 3.4 Wire error Continue and success View my timetable through `router.dismissTo("/calendar")`, and wire source completion through `router.dismissTo("/calendar-import-result")` without `dismissAll()`, root reset, or `navigate`.
- [x] 3.5 Add component and route-structure tests proving loading deduplication, sync-only Retry, empty-event success, name-warning success, CTA behavior, onboarding absence, existing-tabs reuse, and no duplicate tabs/result entries.

## 4. Rework QR and iCal source states

- [x] 4.1 Add shared localized import-progress presentation and complete FR/EN typed keys for source progress, result loading, partial failure, retry/continue, success, and View my timetable.
- [x] 4.2 Update QR so a valid claim unmounts the camera, renders progress, uses checkpointed Retry, returns Change method to the existing chooser with the completed draft retained.
- [x] 4.3 Update the QR controller's terminal phase to request the root result exactly once and remove local camera-backed completion plus the legacy successful-import exit helper.
- [x] 4.4 Update iCal so a valid submit replaces the form with progress across create/resolve/upsert, preserves its validation/report behavior on failure, and requests the root result only after durable completion.
- [x] 4.5 Extend QR and iCal tests for camera unmount, progress accessibility, checkpoint reuse, rapid-input exclusion, source replacement, chooser Back behavior, late-settlement inertness, report privacy, and result handoff.

## 5. Stabilize export-guide provider chrome

- [x] 5.1 Add the short FR/EN export-guide header key and mount the provider route's `Stack.Screen` before loading/error/content early returns.
- [x] 5.2 Move the full provider-selection prompt into `PageIntro` content while retaining its explanatory caption and readable provider list.
- [x] 5.3 Extend provider selection and route-title tests to prove the same compact title in loading, blocking-error, and loaded states and the absence of raw `export-guide/providers` chrome.

## 6. Document and verify the completed flow

- [x] 6.1 Update the mobile navigation/data architecture book and add or update the relevant decision record so it describes root result ownership, `dismissTo` stack behavior, checkpoint lifetime, serial sync, and the deferred server-idempotency gap as current state.
- [x] 6.2 Update the manual device inbox handoff for iOS and Android to cover QR camera teardown, loading/error/success announcements, Dynamic Type, native Back/gesture behavior, repeated QR/iCal recovery, and immediate Calendar event visibility.
- [x] 6.3 Run every edited focused Jest suite immediately after its test changes, then run `npm run react-doctor:changed`, Expo declaration generation with `APP_VARIANT=development npx expo customize tsconfig.json`, `npx tsc --noEmit`, and `npm run lint` from `mobile/`.
- [x] 6.4 Run the full mobile gate with `npm test -- --coverage`, verify generated-client drift with `npm run generate` plus a clean `src/api/generated` diff, and run `openspec validate complete-mobile-calendar-import-flow --strict`.
- [ ] 6.5 Perform the recorded iOS and Android navigation/import pass and confirm the final root stack is the existing Calendar tab with events visible without killing or relaunching the app. (HUMAN: see `docs/react-native-migration/inbox/2026-09-20-calendar-import-finalization-device-pass.md`; this host has no simulator/emulator.)

## 7. Fix device-QA navigation and iCal recovery regressions

- [x] 7.1 Keep completed guide pages navigable: earlier pages advance without resetting completion; the final page returns to the chooser without repeating completion telemetry. Cover Back → Next on final and earlier pages.
- [x] 7.2 Keep Import as the sole iCal submit/retry action, preserving validation, checkpoint resume, error announcement, and Report. Assert the redundant Retry control is absent and Import retries successfully.
- [x] 7.3 Make protected-source recovery focus-aware and follow the selected handoff after completion. Let the outgoing QR guard own replacement after the handoff update, avoiding competing navigation commands. Exercise the real draft provider/reducer, retained outgoing screen, invalid direct entry, and draft invalidation.
- [x] 7.4 Update specs/design and device QA steps; run focused and full mobile tests, typecheck, lint, React Doctor, OpenSpec validation, and live Metro bundle checks. Leave native device gesture verification explicit.

Verification for section 7: 205 suites / 1,978 tests pass with coverage thresholds; TypeScript,
lint, React Doctor, and strict OpenSpec validation pass. Live iOS and Android Metro bundles return
HTTP 200 and the development API health check passes. Native Back/gesture checks remain in 6.5.
