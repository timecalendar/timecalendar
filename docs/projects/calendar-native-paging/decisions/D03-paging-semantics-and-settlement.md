---
kind: decision
id: D03
status: approved
traces-to: [P01, P03]
supersedes: []
---

# D03 — One page per fling, settlement detected on the UI thread, commit by index

## Context and evidence

- **Product law §6.1:** one swipe or fling settles one page; the title and date stay while a
  finger holds; page, title, date, accessibility and events update together on settle.
- **Momentum-end events are unreliable** (R02 §2):
  - iOS does not emit momentum-end when the finger lifts exactly on a page boundary
    (`RCTScrollViewComponentView.mm:800-805`).
  - Android emits momentum begin/end on every touch-up (`ReactHorizontalScrollView.java:1183-1219`),
    but TalkBack scrolling bypasses RN snapping and emits only `onScroll`.
  - A programmatic `scrollTo` behaves differently per platform (R02 §5).
- **Today's controller** runs a request/settle/cancel/replace reducer with pending and accepted
  revisions (`ui/calendar-screen/use-calendar-screen-controller.ts:31-129`).

## Options considered

- **Settle on `onMomentumScrollEnd`.** Misses some platform paths.
- **Settle when the offset is page-aligned, no finger is down and there is no momentum, evaluated
  in the UI-thread scroll handler** (proposed).
- **Allow multi-page flings** (`snapToInterval` without `disableIntervalMomentum`). This changes
  product law §6.1 and needs the owner's amendment.

## Proposed choice

**Paging.** Keep one page per fling.

**Settlement.**
- Settlement is evaluated on the UI thread. When the offset is page-aligned, no finger is down and
  there is no momentum, the handler calls `scheduleOnRN(onSettle, index)` once per settled index.
  Geometry and re-base epochs filter stale events.
- The controller stores only `selectedDay`.
- Programmatic navigation calls `scrollToIndex(index, { animated })` on the pager. This covers
  Today, `focusDate`, day/week, and accessibility increment/decrement.
- The transition reducer, its revisions, `generation` and `consumedGenerationRef` are deleted.

**Title during chained swipes.** The title and date follow each settle. When swipes chain without
an intermediate settle, they update once at the final settle; the header strip itself moves live
with the scroll.

**Weekend toggle and rotation.** Keep the committed day, re-apply `x = index × newPageWidth`, and
add no motion.

**Background.** Going to background keeps the committed date and offset, and needs no reset
machinery.

## Tradeoffs and consequences

- One code path serves gesture, programmatic and accessibility paging.
- Multi-week travel stays one page per fling. Fast repeated swipes become the fast-travel gesture.
- The Android settle feel (physics versus a fixed 250 ms) is decided on the device in the spike.

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers).
