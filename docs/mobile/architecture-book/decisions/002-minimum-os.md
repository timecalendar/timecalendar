# 002 — Minimum OS: iOS 15.1, Android API 24

> Origin: migration-approach §8, knob **K-2** (proto-ADR → real ADR at scaffold).

## Status

Accepted. **⚠️ Revisit fired (2026-06-12, scaffold time):** Expo SDK 56's own
minimum iOS deployment target is **16.4** (> our 15.1), and an SDK raising its own
minimum is an explicit revisit trigger below — so the **effective floors are
iOS 16.4 / Android API 24** (Android unchanged: SDK 56's Android minimum is 21,
below our 24, so our floor stands there). This is the binding floor and is kept
consistent with the Architecture Book's "Minimum OS floors" section.

## Context

The OS floor trades device reach against the cost of supporting old platforms. The
target had to roughly match Flutter's reach (no meaningful user regression) and
sit at or above Expo's own minimums.

## Decision

iOS 15.1 floor, Android `minSdk 24`. Liquid Glass degradation baseline:
iOS 15.1–25 → non-glass fallback (blur/solid surfaces), iOS 26+ → Liquid Glass;
Android uses Material 3 throughout.

**Why:** matches Expo's minimums and barely moves from Flutter — iOS 15.0→15.1
loses ~no devices; Android's effective floor was already ~API 23 via Firebase, so
API 24 drops only Android 6.0, a sub-1% sliver in 2026.

**Effective outcome after the fired revisit:** **iOS 16.4 / Android API 24**, with
the Liquid Glass baseline becoming **iOS 16.4–25 → non-glass fallback**,
**iOS 26+ → Liquid Glass**. Devices capped at iOS 15.x (iPhone 6s/7/SE 1st-gen
class) fall below the floor.

## Consequences

- The non-glass fallback baseline is iOS 16.4–25; theming (step 10) and the splash
  (step 13) inherit the degradation obligation against this floor.
- Encoded in `mobile/app.config.ts` via `expo-build-properties` (kept explicit even
  where redundant — documents intent, survives SDK default drift). Architecture
  Book → "Minimum OS floors".

## Revisit if

Analytics show a non-trivial install base below these floors (check before release
if the iOS 15.x sliver matters), or a chosen SDK raises its own minimum again.
