# Calendar surface — visual brand review on both platforms (DoD native-correctness)

**Date:** 2026-06-16
**Roadmap:** Phase 04 (`docs/react-native-migration/01-roadmap/04-calendar-core.md`)
**Spike/ADR:** [019](../../../.claude/rules/mobile/decisions/019-calendar-rendering-adopt-calendar-kit.md)
**For:** Samuel (needs human eyes on both platforms — the loop/CI cannot judge a designed surface)

The calendar is a **designed brand surface**, not native-default chrome (R-3, and the Phase-04
roadmap calls this out explicitly). The DoD **native-correctness axis** requires a human visual
review of the rendered timeline on **both iOS and Android** — static tooling cannot judge it.

## What to review (once the rendering ship lands)

- **Event tiles** (`renderEvent`): legibility at dense widths (a 5-way overlap → ~20% column
  width), title/location truncation, the `#RRGGBB` event colors, contrast of white text on
  course colors (the brand-contrast posture, theming.md — some course colors may need a darker
  text or a scrim).
- **Grid chrome** (`theme` from `@/theme`): hour labels, grid lines, the day header, the
  **now-indicator** (brand pink) — all reading as *our* brand, not the library's defaults.
- **Day vs. week vs. agenda** parity with the product intent (the Flutter app is the
  *functional* reference, the platform is the *design* reference — R-3).
- **Light + dark** schemes; **Dynamic Type** (never `allowFontScaling={false}`); **touch
  targets** on tappable events (≥44pt/48dp); **VoiceOver/TalkBack** on events and view-switch
  controls.

## Design-asset gap (if any)

If the calendar needs brand artifacts we don't have (illustrations, a custom empty-state),
inbox a "designer calendar polish" follow-up and ship a tasteful **native-default-styled**
version meanwhile (R-3 — do not stall the loop). The spike confirmed brand styling is fully
reachable via `theme` + `renderEvent`; this review is about taste, not capability.

Report any adjustments back so they fold into the rendering ship's follow-up.
