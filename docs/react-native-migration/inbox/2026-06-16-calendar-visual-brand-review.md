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
- **Agenda / planning view** (`add-mobile-calendar-agenda`, the third in-place view mode — a
  bounded `SectionList` of day-grouped events, NOT the calendar-kit grid): the **day headers**
  (the locale-aware short weekday abbreviation + the day-of-month, FR "LUN." vs EN "MON"), the
  **event tiles** (radius ~15px / `Radii.large`, the subtle shadow — offset (0,3), 6% black,
  blur 15, Flutter planning-tile parity, on `backgroundElement`), the **`#RRGGBB` color tint**
  (rendered as the tile's left accent border, not a fill — re-check it reads on both schemes),
  the **title / time-range / location** legibility, and the **now/upcoming indicator** (the
  brand-`primary` accent column marking the next-upcoming event). Confirm the **3-way
  day/week/agenda switch** reads correctly. The agenda is a bounded list (lower frame-rate risk
  than the Reanimated grid), reviewed in this same pass — no separate inbox note.
- **Light + dark** schemes; **Dynamic Type** (never `allowFontScaling={false}`); **touch
  targets** on tappable events (≥44pt/48dp); **VoiceOver/TalkBack** on events and view-switch
  controls.

## Design-asset gap (if any)

If the calendar needs brand artifacts we don't have (illustrations, a custom empty-state),
inbox a "designer calendar polish" follow-up and ship a tasteful **native-default-styled**
version meanwhile (R-3 — do not stall the loop). The spike confirmed brand styling is fully
reachable via `theme` + `renderEvent`; this review is about taste, not capability.

Report any adjustments back so they fold into the rendering ship's follow-up.
