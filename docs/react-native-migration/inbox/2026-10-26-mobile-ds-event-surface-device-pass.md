**For:** whoever runs screen-reader and device passes on Android (OpenSpec
`mobile-ds-event-surface`). The iOS simulator pass runs in the delivery pipeline. A real TalkBack
session, Android rendering and the high-text-contrast setting need a person on a device or the
Windows host, never the Mac.

# Event surface: Android device pass

## What I need

A pass in French and English on an Android development build of `feat/mobile-ds-event-surface`.
Run it in light and dark, at the default font scale and at 2.0. Story ids open with
`timecalendar-dev://developer/gallery/<id>`.

1. **The grid look.** On `event-surface--palette`, Home (upcoming cards, all-day items, today
   timeline) and Calendar → Agenda:
   - Each tile is the event's pale tint with a straight 3 dp stripe in a deeper shade of the same
     color along its leading edge, 8 dp corners, and no shadow.
   - Agenda tiles have no gray fill and no shadow; the brand now marker stays beside the tile.
   - Compare an event in the week grid with the same event in the agenda and on Home: the tint and
     stripe colors match.
2. **Text.** Title, time and location are black on light tints and white on dark tints, never gray.
   At 2.0, text wraps up to its cap and ellipsizes; no line is cut mid-glyph and nothing is
   shrunk (`event-surface--long-strings`, Home reflowed timeline).
3. **High text contrast.** Turn on Settings → Accessibility → High contrast text. On
   `event-surface--increased-contrast` and the agenda, each tile has a 2 dp outline and a paler
   tint, and the story caption says the signal is on.
4. **Checklist pills.** On `event-surface--checklist` and an agenda tile with checklist progress,
   the pill's outline, glyph and count are in the tile's text color; complete and partial differ by
   glyph.
5. **TalkBack.** Each tile is one stop. It reads the title, time, location and any progress, then
   "button" and the hint (Home: "View event details" or "Edit this event"). A double tap opens the
   event. The ripple shows on press.

## Why

Jest proves the resolved colors, the props and the accessibility tree, not how Android draws a
leading border on rounded corners, what TalkBack announces for a merged pressable, or what the
high-text-contrast signal does on a real device. Android builds freeze the Mac, so the pipeline
cannot run this pass.

## How to verify

- For each item, record pass or fail with a screenshot (and the TalkBack transcript for item 5) in
  this file, then move it to done.
- If the stripe renders curved or tapered at the corners (item 1), file the finding here. The fix
  belongs in `mobile/src/design/event-surface/event-surface.tsx` (draw the stripe as a clipped
  leading view instead of a border).
