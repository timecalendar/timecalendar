---
kind: decision
id: D04
status: approved
traces-to: [P02]
supersedes: []
---

# D04 — No JavaScript and no layout on any gesture frame

## Context and evidence

**Pinch.** Every pinch frame animates `top`/`height` on about 179 + 2 × tiles views across 3 pages
(`renderer/owned-calendar-canvas.tsx:204-212, 286-295, 412, 730-758, 886, 924-942`).
- **No fast path for layout properties.** Reanimated 4.3.1 has none for `top`/`height`
  (`PropValueProcessor.cpp:12`), so every frame does a shadow clone, a commit, a Yoga layout and
  N mounts (R03 §1).
- **Per-tile `onLayout`.** It fires a JS event per tile per frame (`canvas.tsx:829-839`).
- **Android delay.** Android defers layout operations that arrive during a draw pass by one frame
  (`NodesManager.java:134-142`).

**Repeated grid.** The hour grid is repeated per page: 49 lines × 3 pages, every one an animated
`top` (R01 §5).

**Flags.** The flags `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` and
`IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` are off by default (`staticFlags.json`). They take
transform/opacity updates off the commit path. They are set through
`package.json` `reanimated.staticFeatureFlags` and need a native rebuild (R03 §1).

**Hairlines.** T03's owner rejected "unstable transformed hairlines". Pixel-rounded `translateY`
rasterizes identically to layout (R03 §2).

## Options considered

- **Pinch:**
  - (a) transforms only, then layout at the end (proposed);
  - (b) container `scaleY` with counter-scaled text, which scales hairlines and makes glyphs
    shimmer;
  - (c) quantized React steps, which breaks §7.2 continuity;
  - (d) the same layout animation with fewer nodes, which still clones, lays out and mounts every
    frame.
- **Grid:** per page (today), or one shared layer behind transparent pages (proposed).
- **RN core flags** (`preventShadowTreeCommitExhaustion`, view culling, view recycling): rejected.
  - Commit exhaustion is only reachable through the Experimental release level.
  - Culling mounts views during gestures.
  - Recycling is Android-only and adds little (R03 §1).

## Proposed choice

**Every gesture frame is UI-thread only:**
- native scroll physics;
- a header strip `translateX` derived from the horizontal offset;
- pinch through shared values.

JS runs only at page crossings, at settle, and on taps or commands.

**Live pinch:**
- Pixel-rounded `translateY` moves lines, labels and tile tops.
- Each tile background is three pieces (a 3-slice): a top cap and a bottom cap of fixed height
  carrying the rounded corners and top/bottom borders, which only translate; and a straight middle
  that translates and stretches with `scaleY`. Corners and border thickness never distort.
- Tile text sits inside an invisible clip window (`overflow: hidden`, `scaleY(s)`) and is
  counter-scaled (`scaleY(1/s)`). It keeps its size and sharpness and is clipped to the live tile
  shape. Line breaks stay as they were when the pinch started.
- When a tile is shorter than its two caps, the middle collapses and the caps meet (computed
  clamp, still transform-only).
- One animated `height` on the page-stack container keeps the focal `scrollTo` from being clamped.
- Only the visible page's tiles update.
- The real layout commits once in `onEnd`, re-wrapping text with an ellipsis.
- Fallback if the spike shows seams between pieces, blurry counter-scaled text, or broken Android
  clipping on a scaled parent: fade out text that no longer fits (opacity) during the gesture.

**Shared grid.** Hour lines are drawn once (49 views) in the vertical content behind transparent
pages. Day separators and the now-line stay per page.

**Flags.** Enable the two Reanimated synchronous UI-props flags. RN core flags stay at Stable.

**Removed from the production path:**
- per-tile `onLayout`, now dev probe only;
- `adjustsFontSizeToFit` in the header;
- nothing about the accessibility focus observer: it stays per tile, mounted only on the committed
  page (about 20 native views). Merging it into one observer per page would change a native module
  for a saving nobody has measured; revisit only if the E05 harness attributes cost to it.

**Budgets:** the P02 thresholds and the view budget in D02.

## Tradeoffs and consequences

- Tiles cost two extra views each (about 40 per dense week), within the D02 view budget.
- Tile text cannot re-wrap during a pinch; re-wrapping is layout. It is clipped to the tile instead.
- The flags need a native rebuild, so they change the runtime fingerprint. That is acceptable
  because the rebuild ships with a new binary anyway; see D08.
- Pages lose their own background colour; the page surface moves to the shared layer.
- The synchronous UI-props flags have known 4.x issues, Reanimated #8810 and #10631. Their fixes
  landed after 4.3.1 (R03), so the spike must test the flags on a device before they are relied
  on.

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers). Tile pinch treatment (3-slice background, counter-scaled clipped text, fade fallback) approved by the owner on 2026-10-01 after the interactive comparison (`https://claude.ai/artifact/9YF6pYQX8HSSwGBwGtFseA`).
