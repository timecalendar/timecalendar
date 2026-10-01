---
kind: ticket
id: T08
epic: E04
status: planned
traces-to: [P01, P03, D01, D02, D03, D07]
depends-on: []
size: L
confidence: medium
---

# T08 — Replace PagerView with the windowed native ScrollView

## Outcome

The canvas renders a windowed horizontal `Animated.ScrollView` keyed by page identity, the header strip follows the scroll offset on the UI thread, settlement reports `onDateCommitted`, and Today, `focusDate` and day/week use `scrollToIndex`.

## Scope

- Delete `pager-page-scroll.ts`, the transition reducer, `generation`, revisions and epochs.
- Wire `CalendarWindowStore` and `PagePresentation`.
- Scope the agenda query to the agenda view.
- Shared hour-line layer with transparent pages.

## Non-goals

- Pinch transform rewrite (T10).
- Accessibility control move (T12).

## Definition of done

- No remount of the scroll owner or retained pages across crossings (test).
- A "three swipes before React commits" test passes.

## Acceptance and verification

- `npm test -- --coverage`, lint, tsc; device run on both platforms.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx`
- `mobile/src/features/calendar/renderer/owned-calendar-coordinator.ts`
- `mobile/src/features/calendar/renderer/owned-calendar-shell.tsx`
- `mobile/src/features/calendar/renderer/owned-calendar-header.tsx`
- `mobile/src/features/calendar/renderer/pager-page-scroll.ts`
- `mobile/src/features/calendar/ui/calendar-screen.tsx`
- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`
- research/R01-current-system-map.md §2

## Size and confidence drivers

About 60 contract sites; spike evidence lowers the risk.

## QA and sensitive surfaces

Vertical inset under the iOS tab bar, weekend toggle, rotation, background mid-swipe.
