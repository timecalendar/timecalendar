## Context

`QrScanScreen` sets `scannedRef.current = true` before parsing a camera result. Invalid values deliberately set it back to `false`, but a valid URL that reaches `addCalendarFromUrl()` leaves it `true` when the create/resolve/upsert chain rejects. The catch branch records the error and renders `WriteErrorNotice`; it neither retains an actionable attempt nor offers a way to re-arm the scanner.

The screen already sits inside the onboarding Stack's ephemeral `ImportDraftProvider` (ADR 047), derives creation fields with `useImportCreateFields()`, calls the one shared persistence seam (`useAddCalendar()`), and exits through `clearDraft()` plus `leaveImportJourney()`. Expo Camera v56 invokes `onBarcodeScanned` whenever a barcode is detected, so the UI must keep a synchronous guard around this callback rather than relying on React render timing. The underlying add-calendar hook exposes pending/error state but does not serialize calls itself.

The current Maestro harness cannot inject a camera barcode and its server fixture exposes no parseable iCal import endpoint. Component tests are therefore the deterministic CI proof; native camera, focus, lifecycle, and platform checks remain a bounded physical-device note.

## Goals / Non-Goals

**Goals:**

- Recover explicitly from a rejected valid-QR import without unmounting or aiming at the same QR again.
- Preserve synchronous single-scan and single-request exclusion across camera callbacks, retry taps, and navigation.
- Keep the captured normalized URL and Stack-scoped institution/programme draft available for retry.
- Use the existing success, navigation, localization, accessibility, and Firebase seams.
- Prevent late promise settlement from clearing the draft, navigating, recording, or updating state after the screen unmounts.

**Non-Goals:**

- Changing URL parsing, camera permission/configuration, the create/resolve/upsert implementation, API/schema/generated clients, or durable storage.
- Adding a second import implementation, QR failure-report payload, automatic retry, background retry, or global/durable attempt state.
- Building a synthetic camera or live network fixture for Maestro, adding `run-e2e`, or changing Architecture Book rules/ADRs.

## Decisions

## Decision 1 — Model one captured attempt and keep synchronous exclusion refs

The screen will retain the current attempt in component memory after parsing succeeds: the normalized URL plus the draft-derived create fields used for that attempt. A small UI state distinguishes ready, importing, and failed presentation, while refs enforce the invariants that cannot wait for React state:

- `scannedRef` remains `true` from the first valid camera callback through pending and failed states.
- an in-flight ref is set synchronously before calling `addCalendarFromUrl()` and cleared only when that attempt settles;
- a completion/active guard prevents duplicate success handling and ignores promise settlement after cleanup.

Both a camera scan and Retry call one local `runAttempt(attempt)` controller. It is orchestration only: the network and persistence work remains exclusively in `addCalendarFromUrl()`.

Why not rely only on `isPending`: hook state is updated asynchronously, so two callbacks or taps in the same turn could both start work before a render. Why not add serialization to the shared hook: this ticket changes QR interaction semantics only, and broadening the shared seam would alter the manual URL screen without a demonstrated need.

## Decision 2 — Failure remains locked until an explicit user action

On rejection, the screen keeps `scannedRef` locked, retains the captured attempt, records the rejection once, and renders this natural focus order:

1. the existing localized alert/live-region failure notice;
2. Retry this QR;
3. Scan another QR;
4. the existing manual iCal route as an alternate path.

Retry reuses the captured normalized URL and fields, clears only the presented failure state, and starts through the same guarded controller. It does not re-arm camera callbacks. Scan another QR clears the captured attempt and failure, then deliberately sets `scannedRef.current = false`; only this action resumes camera acceptance. The manual action pushes `/onboarding/ical-url` without clearing the draft.

No automatic re-arm follows a backend failure. That prevents a QR still visible in the viewfinder from immediately issuing another request. Buttons are at least 48dp high, expose translated labels/roles and disabled state while relevant, preserve Dynamic Type, and follow the existing alert-plus-controls accessibility pattern rather than adding a new focus abstraction.

## Decision 3 — One success and one error record per real attempt

Every invocation that actually enters `addCalendarFromUrl()` owns exactly one catch path. A rejection calls `recordUnknownError(error, "calendar-sources/qr-scan")` once with the existing constant context and no URL, token, or attempt object. Invalid/non-calendar values still never call the seam.

A successful initial scan or retry calls `clearDraft()` and `leaveImportJourney()` through one guarded completion path. The completion guard makes this idempotent if callbacks race, and the active guard makes navigation/unmount a terminal boundary for late resolutions or rejections.

## Decision 4 — Deterministic component proof, bounded device evidence

The colocated RNTL test will use deferred promises to make concurrency observable and will keep the real parser while mocking the feature add-calendar hook, onboarding draft seam, Firebase seam, and camera callback as it does today. Tests will prove failed lockout, captured-URL retry, repeated rejection accounting, scan-another re-arm, rapid/double-tap exclusion, success exactly once, draft survival, manual-route preservation, and unmount safety.

The existing permission, invalid-value, no-draft, and success cases remain green. A new or updated `(HUMAN: ...)` inbox note will cover retry success/failure, scan-another, back/navigation lifecycle, VoiceOver/TalkBack announcement and focus order, Dynamic Type/touch targets, and iOS/Android physical camera behavior. No Maestro file or label change is warranted by a fixture that cannot exercise the behavior.

## Risks / Trade-offs

- [A URL remains in component memory after failure] → Keep it only for the mounted screen lifetime, never log it, render it, attach it to error metadata, or persist it; clear it on Scan another and let unmount discard it.
- [React state and refs diverge] → Centralize transitions in `runAttempt`, Retry, and Scan another handlers, and assert the visible state plus accepted/ignored calls with deferred-promise tests.
- [A camera callback races a retry] → Keep `scannedRef` locked and set the in-flight ref synchronously before the promise starts.
- [Late settlement navigates after Back] → Flip the active ref during effect cleanup and guard all success/failure side effects.
- [Extra controls crowd the camera overlay at large text] → Use the existing centered/max-width patterns, allow font scaling, maintain minimum targets, and record device-level large-text checks.

## Migration Plan

This is a local UI/state change with no persisted data or deployment migration. Rollback is the proposal commit/revert of the screen, tests, translations, and device note; no server, schema, native build configuration, or data cleanup is involved.

## Open Questions

None. Product recovery actions, observability, draft lifetime, fixture limits, and sensitive-surface exclusions are fixed by the handoff.
