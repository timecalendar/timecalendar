## 1. Guarded QR attempt controller

- [x] 1.1 Refactor `mobile/src/features/calendar-sources/ui/qr-scan-screen.tsx` to retain one normalized URL plus its draft-derived create fields in component memory and route initial scans and retries through one local `runAttempt` controller; keep `addCalendarFromUrl()` as the only create/resolve/persist implementation.
- [x] 1.2 Add synchronous in-flight, scan-debounce, active-screen, and success-completion guards so camera callbacks and retry taps cannot start concurrent work, success clears the draft/leaves once, and promise settlement after unmount has no navigation, draft, recording, or state side effect.
- [x] 1.3 Keep the scanner locked after each rejected valid attempt; make Retry reuse the captured attempt without re-arming, and make Scan another QR clear failure/attempt state before deliberately re-arming the camera. Verify invalid/non-calendar QR still re-arms immediately without recording.
- [x] 1.4 Add a failure-state action that pushes the existing `/onboarding/ical-url` route with no QR URL/token parameters and without clearing the Stack-scoped import draft.

## 2. Accessible localized recovery UI

- [x] 2.1 Render the existing alert/live-region failure notice before explicit Retry, Scan another QR, and manual-iCal controls; give every control a translated label, button role, disabled state where applicable, and a minimum 48dp target while preserving Dynamic Type and natural focus order.
- [x] 2.2 Add flat recovery keys with typed FR/EN parity in `mobile/src/i18n/locales/en.json` and `fr.json`; do not render, interpolate, log, or attach the captured URL, token, or draft fields.
- [x] 2.3 Keep `recordUnknownError(error, "calendar-sources/qr-scan")` at the local attempt boundary so every rejected `addCalendarFromUrl()` invocation is recorded exactly once with constant context and duplicate/invalid callbacks produce no record.

## 3. Deterministic CI proof

- [x] 3.1 Extend `qr-scan-screen.test.tsx` with deferred-promise coverage for valid scan rejection, ignored callbacks while pending and failed, captured normalized-URL Retry success, repeated Retry failure, Scan another re-arm, and rapid/double-tap plus retry/camera concurrency exclusion; follow the awaited RNTL 14 conventions in `testing.md`.
- [x] 3.2 Assert draft/create fields survive rejection and retry, manual iCal navigation does not clear or expose the attempt, invalid QR remains unrecorded/re-armed, and direct-route no-draft behavior remains supported.
- [x] 3.3 Assert each real rejected invocation records once, duplicate callbacks/taps record nothing extra, successful initial/retry/new-scan attempts clear and leave exactly once, and late resolve/reject after unmount produces no side effect or React state-update warning.
- [x] 3.4 Keep existing camera permission loading/grant/denied/Settings, QR-only configuration, initial success, and invalid-value tests green; run `cd mobile && npx jest src/features/calendar-sources/ui/qr-scan-screen.test.tsx --maxWorkers=4` as the focused proof.

## 4. Architecture and physical-device evidence

- [x] 4.1 Update the `calendar-sources` current-state guidance in `docs/mobile/architecture-book/features.md` and append the corresponding dated `CHANGELOG.md` entry for explicit QR failure recovery; do not alter binding rules or add an ADR because the design remains inside ADR 017/047 and existing accessibility/testing/Firebase contracts.
- [x] 4.2 Add or update a `(HUMAN: ...)` note under `docs/react-native-migration/inbox/` for physical iOS/Android retry success/failure, Scan another, camera and Back/unmount lifecycle, VoiceOver/TalkBack announcement/focus order, Dynamic Type, and 44pt/48dp checks; mark it non-blocking and document why Maestro cannot drive it.

## 5. Local green and handoff evidence

- [x] 5.1 Run `openspec validate fix-mobile-qr-import-recovery --strict` and an early archive dry-run/check so delta headers and scenarios are known to merge cleanly before final review.
- [x] 5.2 Run the normal mobile local-green gate: `cd mobile && npx tsc --noEmit && npm run lint && npm test -- --coverage`; do not lengthen test waits or weaken assertions to fit the per-test budget.
- [x] 5.3 Confirm `git diff --stat origin/main -- openapi/openapi.json mobile/src/api/generated server/src/migrations mobile/app.config.ts mobile/eas.json mobile/firebase terraform k8s .github/workflows app` is empty and no calendar URL/token appears in logs, fixtures, snapshots, comments, screenshots, or error metadata.
- [ ] 5.4 On the exact pushed PR head, confirm the normal CI checks are green; do not add `run-e2e`, invent a network fixture, or claim physical-device execution. Update the PR body's stage, affected modules, sensitive-surface statement, and bounded device-evidence note before handoff.
