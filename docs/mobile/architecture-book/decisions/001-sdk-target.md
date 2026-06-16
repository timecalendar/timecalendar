# 001 — SDK target: latest stable Expo SDK at scaffold time

> Origin: migration-approach §8, knob **K-1** (a proto-ADR that becomes a real ADR
> when `mobile` is scaffolded). This is that real ADR.

## Status

Accepted. **⚠️ Revisit fired (2026-06-12, scaffold time):** SDK 56 shipped stable
before Phase 0 completed, so we scaffolded directly on SDK 56 and **skipped** the
planned interim 55→56 upgrade (the revisit clause below fired exactly as written).

## Context

A foundation must not sit on a beta SDK — that violates the no-concessions
principle (philosophy §1). At decision time the open question was whether SDK 56
would be stable in time: SDK 55 already gave New Architecture + Hermes, native
tabs (alpha, 54+), and `expo-glass-effect` — enough for Phases 0–1 — while SDK 56
GAs Expo UI (SwiftUI/Compose), which matters most for the Phase 2 calendar and
rich native chrome.

## Decision

Scaffold on the latest **stable** Expo SDK at scaffold time. If SDK 56 is stable
by then, use it; otherwise start on SDK 55 and treat the 55→56 upgrade as a
tracked ADR that **must land before Phase 2** (calendar / Expo UI GA).

**Outcome:** SDK 56 was stable before Phase 0, so we used it directly — Expo SDK
56 (React Native 0.85.3), New Architecture + Hermes as the only supported mode.

## Consequences

- Phase 2 inherits no SDK-upgrade debt — Expo UI is already GA on the scaffolded
  SDK, so the calendar and native-chrome work start on a current base.
- SDK 56's own minimum deployment target (iOS 16.4) raised our effective OS floor
  — see [002 — minimum OS](./002-minimum-os.md), whose revisit fired for this reason.
- Encoded in the scaffold: `mobile/app.config.ts` + `mobile/package.json` pins.
  Architecture Book → "Runtime baseline".

## Revisit if

A future SDK introduces a breaking change we must defer, or a beta-only capability
becomes load-bearing before it GAs (we would re-open the stable-only stance and
record the trade-off).
