# 062 — Page the Calendar with a windowed native horizontal ScrollView

## Status

Accepted.

## Context

Day and Week page horizontally inside the one native vertical ScrollView that owns the clock
axis. Paging has to land exactly one page per fling, accept a new swipe mid-settle, keep the
dated header, title, events and accessibility context in agreement, and keep far dates
navigable. A pager with a fixed set of pages that commits only at idle leaves a second swipe
nowhere to go, and widening a native pager resets its native page container. The full
investigation, options and device evidence live in the
[calendar-native-paging project](../../../projects/calendar-native-paging/design.md)
([D01](../../../projects/calendar-native-paging/decisions/D01-native-scrollview-paging-owner.md),
[D02](../../../projects/calendar-native-paging/decisions/D02-page-identity-and-window.md),
[D03](../../../projects/calendar-native-paging/decisions/D03-paging-semantics-and-settlement.md),
[D05](../../../projects/calendar-native-paging/decisions/D05-window-data-store-and-presentation-cache.md))
and its [E02 spike evidence](../../../projects/calendar-native-paging/evidence/E02-spike.md).

## Decision

One React Native `Animated.ScrollView` with `horizontal` owns Calendar paging. It sits beside
the fixed hour gutter inside the vertical ScrollView (`renderer/owned-calendar-pager.ts`,
`owned-calendar-canvas.tsx`).

- **Physics are native.** iOS uses `pagingEnabled`; Android uses `snapToInterval` with
  `disableIntervalMomentum`. One fling settles one page, and a touch mid-deceleration takes the
  scroll over natively. A Gesture Handler `Gesture.Native()` wraps it, simultaneous with the
  pinch.
- **Pages are absolute indexes.** A page index is the civil `EpochDay` in Day mode and the week
  ordinal aligned to the first weekday in Week mode (`data/page-index.ts`). A page is keyed by
  its content address `mode:epochDay`, so a page that stays in the window never remounts.
- **The content is a re-based window.** The content spans `baseIndex ± 260` pages at
  `index × pageWidth`, with `pageWidth` pixel-aligned (`data/page-window.ts`). A settle within
  30 pages of an edge re-bases the window with a non-animated `scrollTo` that keeps the
  absolute position. Navigation is unbounded and the content width stays constant.
- **About five pages are mounted:** the centre page ± 2. The centre moves when the UI-thread
  rounded index crosses a page boundary.
- **The UI thread owns motion and settlement.** The scroll handler worklet tracks the offset,
  drives the dated-header strip (`translateX = −scrollX`), and calls React only on a page
  crossing and on a settle. A page settles when its offset is page-aligned with no finger down
  and no momentum. Events whose layout or content width differs from the last placement are
  ignored, which filters stale geometry and the previous mode's content.
- **The controller stores only the committed date.** The shell reports one
  `onDateCommitted` per settle. Today, `focusDate` and mode switches move the pager to an index;
  accessibility increment and decrement step one page through the same path.
- **Data follows the window.** The screen-level `CalendarWindowStore` reads 28-day chunks
  around the mounted pages, and each page has an explicit `loading | ready | error` status and a
  frozen, cached `PagePresentationV1` ([storage.md](../storage.md), [calendar.md](../calendar.md)).

Rejected: a pager without the remount key (cannot fix iOS), an owned Reanimated slot pager
(non-native physics), list virtualizers with paging (the window is managed on the JS thread), and
a native module or `@expo/ui` (iOS 17 floor or a second native codebase).

`react-native-pager-view` remains installed for the onboarding carousel only
([ADR 036](./036-native-onboarding-pager.md)).

## Consequences

Native physics, interruptibility and screen-reader scrolling come from the platform. The
re-base and the stale-event filter are owned mechanisms that need their own tests. A chain of
fast swipes can scroll a page into view before it mounts; that page shows the shared grid and a
busy, never-empty state until it mounts. Android arbitrates the nested scroll views on equal
touch slop. `calendar-owned-shell.contract.test.ts` pins the single horizontal owner and the
renderer inventory.

## Revisit if

Device evidence shows Android diagonal starts misfiring between the two scroll views, a fast
chain regularly outruns mounting, or React Native changes `ScrollView` paging semantics. A move
to multi-page flings is a product change and needs the owner's amendment of the one-page rule.
