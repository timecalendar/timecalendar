# QR scan — on-device DoD manual verification (HUMAN)

**Change:** `add-mobile-qr-scan` (Phase 03 ship 3). **Date filed:** 2026-06-15.

## Why this is here

The QR scanner uses the real device camera. CI (`tsc` / lint / Jest) and Maestro **cannot**
drive a camera or grant a camera permission deterministically across platforms (Architecture
Book "Testing": e2e can't drive a camera; mirrors the `@expo/ui` "Maestro can't drive the
native picker" posture). The scan→parse→state **wiring** is proven in CI by a Jest test that
mocks `expo-camera` and fires a synthetic `onBarcodeScanned`. Everything below is the
irreducibly-on-device half — it must be checked by a human on a real iOS device and a real
Android device before this ship is DoD-complete.

The implementer should mark the relevant DoD axes (E2E, Accessibility, Native correctness)
as covered-by-this-note and **skip-and-continue**, not block.

## What to verify (iOS + Android, both)

1. **Native config / prebuild.** Run `npx expo prebuild --clean` in `mobile/`. Confirm it
   succeeds with the new `expo-camera` plugin (no pod/static-frameworks break — if it breaks
   under iOS `useFrameworks: "static"`, the escape is `ios.forceStaticLinking`). Confirm the
   iOS `NSCameraUsageDescription` string and the Android `CAMERA` permission appear in the
   generated `Info.plist` / `AndroidManifest.xml`, and that `RECORD_AUDIO` is **absent**
   (we set `recordAudioAndroid: false`).

2. **Permission lifecycle.**
   - First open (undetermined): the explainer shows; "grant access" triggers the OS dialog.
   - Grant: the live camera preview renders; pointing at a QR code scans it once.
   - Deny, then reopen (can't-ask-again): the "open Settings" guidance shows; the button
     opens the OS app settings; returning with access granted now shows the camera.

3. **Scan correctness.** Generate a QR encoding a real iCal/calendar URL (an `https://…`
   or `webcal://…` URL — the same kind the TimeCalendar website / a university page shows).
   Scan it: confirm exactly one scan is handled (no double-fire), the parsed URL is confirmed
   on screen, and a non-URL QR (e.g. a contact card) shows the recoverable "not a calendar QR"
   message and re-arms.

4. **Accessibility (manual).** VoiceOver (iOS) + TalkBack (Android): the explainer/permission/
   error states announce (polite live region); every button has a meaningful translated label
   and a ≥44pt/48dp target; the camera viewfinder announces its purpose ("point at a QR code")
   — a screen-reader user cannot aim a camera, so confirm the explainer makes the fallback
   (paste a URL — ship 4) discoverable once that ship lands. Check at large Dynamic Type.

5. **Native correctness (R-3).** The screen reads as a platform-native camera surface, not a
   Flutter port. Both platforms reviewed against the platform, not against the Flutter app.

6. **Observability.** Trigger a thrown failure path if reachable; confirm it reaches
   Crashlytics via the `@/firebase` seam (DebugView / Crashlytics dashboard). A recoverable
   non-calendar-QR is NOT expected to record (by design).

## How to confirm done

All six checked on both platforms → mark the QR-scan DoD E2E / Accessibility / Native-
correctness / Observability(on-device half) axes ✅ in the feature review. If prebuild fails,
that is a real blocker for this ship's native config — fix before merging (it is the only gate
CI can't catch).
