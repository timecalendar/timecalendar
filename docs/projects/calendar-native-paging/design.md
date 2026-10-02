---
kind: design
status: approved
---

# Target technical design

## Current context and constraints

The Calendar screen (`mobile/src/features/calendar/ui/calendar-screen.tsx`) connects four layers:

- **Controller** (`ui/calendar-screen/use-calendar-screen-controller.ts`): a transition reducer
  with request/settle/cancel/replace, pending and accepted revisions, and `generation`.
- **Presentation hook** (`data/timeline-presentation-hook.ts`): builds an exact three-page
  presentation.
- **Shell** (`renderer/owned-calendar-shell.tsx`) and **coordinator**
  (`renderer/owned-calendar-coordinator.ts`): drive one native vertical `Animated.ScrollView`.
- **Canvas** (`renderer/owned-calendar-canvas.tsx`): inside that ScrollView, a fixed hour gutter
  and a three-page `react-native-pager-view`. The canvas keys the pager by
  `${generation}:${geometryRevision}`, so every accepted page remounts the pager.

The full "before" map is in `research/R01-current-system-map.md`.

**Constraints:**
- **Stack:** Expo SDK 56 CNG, RN 0.85.3 Fabric, Hermes, React 19.2.3 with React Compiler 1.0.0,
  Reanimated 4.3.1, Gesture Handler ~2.31.
- **iOS floor:** 16.4.
- **Product law:** the owned-renderer `product.md` §6.1, §7.2, §9, §12 and §13 still apply.
- **Repository rules:** Architecture Book import boundaries B-1…B-4, and the 90% branch gate on
  `src/features/*/!(ui|renderer)/**`.

## Target architecture

```
CalendarScreen
├─ controller: selectedDay, mode, zoom preference                            (D03)
├─ CalendarWindowStore (chunks, page status, PagePresentation LRU)           (D05)
└─ OwnedCalendarShell  { context, viewport, onDateCommitted, focus, requestZoom }  (D07)
   ├─ Date header
   │  ├─ adjustable paging control (gutter corner, plain View)               (D06)
   │  └─ header strip: keyed window slots, translateX = −scrollX (UI thread)
   └─ Vertical Animated.ScrollView (native; unchanged role)
      └─ full-day row (one animated height during pinch)                     (D04)
         ├─ hour gutter (labels; translateY during pinch)
         ├─ shared hour-line layer (49 views)                                (D04)
         └─ Horizontal Animated.ScrollView (snap one page, about ±260 pages) (D01, D02)
            └─ about 5 pages at left = index × pageWidth, keyed mode:epochDay
               ├─ day separators, now-line (if today)
               └─ tiles (one animated view each) + conflict targets
   + one conflict chooser at shell level
```

**Responsibilities:**
- **Motion is native.** Vertical scroll, horizontal snapping, deceleration and mid-fling grabs
  belong to UIKit and Android scroll views (D01).
- **The UI thread derives everything per frame.** A scroll handler worklet computes the rounded
  index, the header `translateX`, settlement and the pinch transforms. It calls `scheduleOnRN`
  only when the index crosses a boundary, when a page settles, and when a pinch ends (D03, D04).
- **React re-renders only** when the window shifts, on settle (exposure, title, `selectedDay`), on
  data arrival, and at the end of a pinch (layout commit).
- **The data layer** owns page identity (`EpochDay`), chunk planning, page status and frozen
  presentations (D02, D05).

## Data and contracts

**Types** (sketches in R04 §7, to be finalized in the implementing change):
- `PageIndex` (integer `EpochDay`, aligned to week start in week mode);
- `PageKey = \`${mode}:${epochDay}\``;
- `PageStatus = loading | ready | error`;
- `PagePresentation` (frozen);
- `ChunkKey` (28-day block aligned to `firstWeekday`).

**Controller and shell contract:**
- The controller passes `selectedDay`, `mode`, `firstWeekday`, `showWeekends`, `displayZone` and
  the zoom preference.
- The shell reports `onDateCommitted(anchor)` once per settle.
- The screen calls `scrollToIndex` through the shell handle for Today, `focusDate` and accessibility
  paging.

**Removed:** `generation`, `revisionFloor`, `acceptedTransitionRevision`, `transitionPending`,
`onTransitionRequest/Settled/Cancelled`, `planCalendarThreePageRange`, the three-tuple presentation
types, and `pager-page-scroll.ts`.

**Specs and docs:**
- **OpenSpec:** `openspec/specs/mobile-calendar-timeline/spec.md` gets MODIFIED and REMOVED deltas
  for the three-page working set, the PagerView boundary scenarios and "no second pager" (R07 §1).
- **Architecture Book:** one new ADR (windowed native ScrollView paging), amendments to ADRs 033
  and 061, updates to `calendar.md` and `storage.md` (per-range live query becomes the chunk store),
  and `CHANGELOG.md`.
- **Owned-renderer project:** D04's PagerView clause and D05 are superseded by D01 and D02. Its
  `design.md` and tickets T05–T08 get superseded notes.

## Security and integrity

There is no new data exposure; the change is local reads only.

**Integrity rules:**
- A chunk result is written only if its sequence number is current.
- Pages are content-addressed, so a late result can only fill its own page.
- A loading page is never presented as confirmed-empty (P03).

**Database migration.** An index migration, if measurements require one, follows the `@/db`
migration runner (`docs/mobile/architecture-book/storage.md`).

## Failure handling and operations

| Failure | Behaviour |
| --- | --- |
| Rendering falls behind a fast chain | A page at +3 may scroll in before it mounts. It shows the shared grid only, marked busy and not announced as empty, until it mounts. |
| A chunk read fails | `PageStatus.error` presents through the existing error surface for that page only. The other pages are unaffected. |
| Geometry change (rotation, split view, insets) | Re-apply `x = index × newPageWidth` without animation, filtered by a geometry epoch. The committed day is kept. |
| Re-base near the content edge | Non-animated `scrollTo` at idle, filtered by a re-base epoch. |
| App goes to background mid-motion | The committed day is kept; the next settle commits normally. |

**Observability.** Crashlytics breadcrumbs for settle and re-base only in the perf build. No
production per-frame logging.

## Rollout and rollback

1. **Quick wins and housekeeping (E01).** Compile the shell and gate the per-tile `onLayout`. Also
   archive T06 and T09, reconcile the owned-renderer tickets and fix the rule pointers.
2. **Device spike (E02).** A development-only route may land on `main`. Its evidence and the
   owner's verdict determine whether to continue per `product.md` and D08.
3. **Rebuild epics.** Straight cutover, no runtime flag (D08). Turning on the Reanimated static
   flags changes the native fingerprint, so the cutover ships in a new binary through the
   preview channel.
4. **Rollback:** git revert plus an OTA republish while the fingerprint is unchanged. Otherwise a
   new binary.

## Verification strategy

- **Jest, in `calendar/data` under the 90% gate:** index↔anchor across DST and `firstWeekday`; the
  window and re-base; the settlement reducer; chunk sequencing and out-of-order completion; page
  status; LRU bounds.
- **Jest, renderer:** about 35 behaviour tests ported from the shell suite. A no-remount test
  (stable page identity across crossings) and a "three swipes before React commits" test. The
  Reanimated scroll-handler mock is extended to every handler key (R07 §3).
- **Build checks:** the production compiler run over `renderer/` reports zero bail-outs (D07). The
  contract test is rewritten for the new owner.
- **Device:** the `mobile/perf/` harness on release APKs built on the PC. The thresholds are the
  P02 table. The R02, R05 and R08 spike checklists run on OnePlus 6 and iPhone. The evidence file
  gate is D08.
- **Soak:** 500 page crossings, then 30 minutes of mixed paging, scrolling, pinching and mode
  switching. Views stay within ±50 and the heap is stable.

## Decision index

- D01 — Windowed native horizontal ScrollView owns paging (`decisions/D01-native-scrollview-paging-owner.md`)
- D02 — Civil-day page index, re-based content window, about 5 mounted pages (`decisions/D02-page-identity-and-window.md`)
- D03 — One page per fling, UI-thread settlement, index commit (`decisions/D03-paging-semantics-and-settlement.md`)
- D04 — No JS and no layout per gesture frame (`decisions/D04-zero-js-zero-layout-per-frame.md`)
- D05 — Screen chunk store, explicit page status, presentation cache (`decisions/D05-window-data-store-and-presentation-cache.md`)
- D06 — Adjustable paging control outside the scroll views (`decisions/D06-accessible-paging-control.md`)
- D07 — Thin boundary, pure data math, compiler-checked renderer (`decisions/D07-renderer-boundary-and-react-idioms.md`)
- D08 — Spike first, device evidence gates releases, straight cutover (`decisions/D08-delivery-gate-and-rollout.md`)

## Open risks

- Android equal-slop nested arbitration and TalkBack (RN #32023). Read from source; retired only by
  the spike.
- How Android's snap feels, and whether a second touch is reconciled mid-snap (R02 §1).
- A chunk read on a OnePlus 6 may be slow enough to show loading pages often (R04 confession).
- Several platform accessibility claims rest on knowledge, not documentation or device tests
  (R05 confession).
- Rewrite size: about 60 contract sites, the 2,310-line shell test, and about 14 spec requirements.
