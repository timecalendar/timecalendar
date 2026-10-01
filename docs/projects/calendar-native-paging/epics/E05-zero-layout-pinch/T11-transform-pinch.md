---
kind: ticket
id: T11
epic: E05
status: planned
traces-to: [P02, D04]
depends-on: []
size: L
confidence: medium
---

# T11 — Transform-only live pinch with layout commit at the end

## Outcome

During a pinch, lines, labels and tiles move by pixel-rounded `translateY`, tile backgrounds stretch by `scaleY`, only one container height animates, and the real layout commits in `onEnd` while focal-time preservation (§7.2) holds.

## Scope

- Rewrite the zoom styles in the canvas and gutter.
- Tiles as a 3-slice background (fixed caps, stretched middle) with text clipped by a counter-scaled window (D04); opacity fade as fallback.
- Remove `adjustsFontSizeToFit` from the header.
- Keep the per-tile focus observer (committed page only); open a follow-up only if the harness attributes cost to it.

## Non-goals

- Zoom menu changes.

## Definition of done

- Harness meets the P02 pinch row.
- No visible hairline instability, cap seams or blurry tile text (owner check, including s ≈ 0.25 on the OnePlus 6).

## Acceptance and verification

- E02 harness; device check of hairlines and focal preservation.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer/owned-calendar-zoom.ts`
- `mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx`
- `mobile/src/features/calendar/data/time-grid.ts`
- research/R03-rendering-and-zoom-performance.md §2

## Size and confidence drivers

The design is source-backed; feel and hairlines need the device.

## QA and sensitive surfaces

Pinch during settle, two-finger lift, zoom menu.
