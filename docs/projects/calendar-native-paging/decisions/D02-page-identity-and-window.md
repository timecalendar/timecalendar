---
kind: decision
id: D02
status: approved
traces-to: [P01, P03]
supersedes: [owned-calendar-renderer/D05]
---

# D02 — Pages are civil-day indexes in a re-based window with about 5 mounted pages

## Context and evidence

- **Content width.** Fabric layout is float32 and Android offsets are integer pixels.
  - **±5 years of weeks** is about 182k pt of content, which is safe.
  - **±5 years of days** is about 3.65M pt, which is not (R02 §3).
- **Product law.** "Dates years away remain navigable" (owned-renderer `product.md` §6.1). The
  owner has rejected "more pages" as a fix (`03-design-direction.md`).
- **Today's identity.** Page identity is `generation` plus a three-element tuple
  (`data/range-plan.ts:20-34`, `data/week-transition.ts:128-131`).
- **The proposed index.** R04 §2 proposes a civil `EpochDay` index with integer week math. It needs
  no timezone formatting and is DST-free.

## Options considered

- **A fixed ±N-year content range per mode.** A visible limit appears after N years, and ±5 years of
  days is too precise for float32.
- **A content window of ±K pages around a base index, silently re-based at idle near either edge**
  (proposed). Navigation is unbounded and the content size is constant.
- **Recentering at every settle.** Recentering during momentum jumps or cancels the deceleration
  (R08 §d). Recentering at every idle risks visible flicker for no benefit.

## Proposed choice

**Identity.**
- A page is identified by civil `EpochDay` (days since 1970-01-01). A week page uses its
  week-start day, aligned to `firstWeekday`.
- The page key is the content address `mode:epochDay`.
- `generation` is removed from renderer identity, focus gating and the data layer.

**Content window.**
- The content spans `±K` pages around `baseIndex`, with K = 260 for both modes (about ±5 years of
  weeks or ±8.5 months of days, and about 182k pt at 350 pt per page).
- When a settle lands within 30 pages of an edge, the view re-bases at idle with a non-animated
  `scrollTo`. Its scroll events are filtered by a re-base epoch.
- The domain is unbounded, which satisfies §6.1 with no product-visible limit.

**Mounted window.**
- About 5 pages are mounted: the settled index ±2.
- The window shifts when the UI-thread rounded index crosses a page boundary, scheduled once per
  crossing.
- The budget is ≤120 views per page and ≤700 per window (R03 §4).

**Mode switch.** Day/week switches remount the horizontal scroller (`key=mode`). That is a rare,
deliberate action.

## Tradeoffs and consequences

- Re-basing is a new mechanism with its own spike check: no visible jump, and correct epoch
  filtering of the synchronous iOS `onMomentumScrollEnd` that a non-animated `scrollTo` emits
  (R02 §5).
- During a chain of more than two fast swipes, the page at +3 may mount after it scrolls into
  view. That needs the loading presentation from D05.
- This supersedes owned-renderer D05's "one settled page plus immediate neighbours, three-page
  policy". The bounded-work intent (no unbounded page cache) is kept.

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers).
