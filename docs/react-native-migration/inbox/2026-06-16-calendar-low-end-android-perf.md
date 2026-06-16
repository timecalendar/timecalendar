# Calendar timeline — low-end Android frame-rate verification (the exit-criterion bar)

**Date:** 2026-06-16
**Roadmap:** Phase 04 step 1/2 (`docs/react-native-migration/01-roadmap/04-calendar-core.md`)
**Spike/ADR:** [019](../../../docs/mobile/architecture-book/decisions/019-calendar-rendering-adopt-calendar-kit.md) (calendar rendering — adopt `@howljs/calendar-kit`)
**For:** Samuel (needs a real **low-end Android** device — the autonomous loop, CI emulators, and the iOS simulator cannot do this)

This is the **performance axis** the Phase-04 exit criteria hang on: *"Day/week/agenda render
real timetables, with overlaps, at target frame rate on a low-end Android device."* A CI
emulator and a desktop-class iOS simulator are **not** a low-end device — this bar can only be
verified on real hardware, so it is inboxed and never blocks the ship loop.

## What the spike DID establish (no hardware needed)

- `@howljs/calendar-kit` v2.5.6 **boots and renders correctly** on the real stack (Expo SDK
  56, RN 0.85.3, Reanimated 4.3.1 + worklets 0.8.3, gesture-handler ~2.31.1, New Arch,
  Hermes) — **no Reanimated-4 crash** (the feared `EXC_BAD_ACCESS`), correct dense-overlap
  column packing on a worst-case Tuesday 5-way cluster, brand-tinted now-indicator, custom
  `renderEvent` tiles. Verified on the iOS simulator (iPhone 17).
- The salvaged pure overlap engine is unit-correct (5-way → 5 even columns; A/B/C → thirds).

## What this note is for (real low-end Android, on the rendering ship)

1. **Install** a release-config **dev-variant** build on a genuinely low-end Android device
   (the kind a French student actually carries — e.g. an entry-level device ~₂GB RAM, 60/90 Hz
   panel; not a flagship). Note the model + panel refresh rate.
2. **Render a real dense university week** (sync a real busy calendar, or the densest seeded
   fixture) in **week view**, the worst case.
3. **Measure during interaction** — vertical scroll, horizontal week-to-week swipe paging,
   pinch-to-zoom (hour height): capture **dropped frames / sustained FPS** against the panel's
   refresh rate (the realistic bar is *zero dropped frames at the device's refresh rate* —
   "120fps" is aspirational where the panel is 60/90 Hz). Use the dev-menu perf monitor / the
   Reassure baseline / Android GPU profiling.
4. **Capture Reassure perf baselines** for the timeline interaction (part of the rendering
   ship's DoD).

## The gate this verifies

- **PASS** → ADR 019's adopt decision holds; tick the Phase-04 exit-criterion perf line.
- **FAIL** (janks on a low-end device, can't be tuned via calendar-kit's perf props) → **ADR
  019's revisit fires**: re-open toward the custom renderer (the spike already prototyped the
  plain-Reanimated-grid + gesture-pager architecture and salvaged the overlap/time-grid
  primitives — they are the ready starting point), swapped **behind the unchanged calendar
  seam**.

Report back the device model, refresh rate, and measured frame stats so the result can be
recorded against ADR 019.
