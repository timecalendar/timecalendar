# Durable design direction, implementation deferred

## Required behavior

A new swipe can take control while the previous swipe is still moving. Repeated
forward motion, reversal, and cancellation must work without a forced idle gap.
The limit on rendered or cached weeks must not become an artificial navigation
boundary. Saving the final date must not unlock the next gesture.

The owner explicitly rejects adding one page on each side as a complete fix:
that only moves the boundary. No replacement component is selected or proven.

## Separate movement, rendering, and data

1. **Movement:** retain one scrolling surface through ordinary week changes.
   Track position continuously. A new drag takes over from the current visual
   position, and an obsolete animation completion cannot overwrite newer input.
2. **Rendering:** keep a bounded moving window of week views, with stable date
   identities. Recycle distant views without changing the apparent position or
   velocity under the finger. Navigation identity must be independent of a
   reusable view slot.
3. **Data:** prefetch bounded nearby date ranges while movement continues.
   Results belong to date/configuration identities. Late reads may fill the
   correct week but must never recenter the surface or relabel another week.
4. **Settlement:** persist the final selected date and update accessibility
   semantics without destroying the scroll owner. Week headers and event dates
   must remain in agreement through partial movement and interrupted settling.

This is an architectural requirement, not a claim of infinite memory, instant
database access, or guaranteed blank-free rendering under arbitrary load. The
supported date domain and behavior when rendering/data fall behind need an
explicit design. A loading week must not be mistaken for a confirmed empty week.

## Current coupling to revisit

Paths are relative to repository root:

| Source | Current contract |
| --- | --- |
| `mobile/src/features/calendar/renderer/owned-calendar-coordinator.ts` | Edge selection commits only at idle; generations reject stale callbacks and reset the pager. |
| `mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx` | Pager key includes generation and geometry revision; initial page is center; overdrag is disabled. |
| `mobile/src/features/calendar/renderer/pager-page-scroll.ts` | Header progress projects three-page position and freezes on accepted settlement. |
| `mobile/src/features/calendar/data/week-transition.ts` | Each accepted transition advances one page and increments generation. |
| `mobile/src/features/calendar/data/range-plan.ts` | Range and page directions are explicitly previous/current/next, with an exactly-three-element page tuple. |
| `mobile/src/features/calendar/data/timeline-presentation.ts` | Presentation models also require exactly three pages. |
| `mobile/src/features/calendar/data/timeline-presentation-hook.ts` | Queries and retained event projections follow the committed three-page range. |
| `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts` | Accepted transitions connect selected date, generation, and screen state. |
| `mobile/src/features/calendar/renderer/owned-calendar-zoom.ts` | Shared scale and vertical offset preservation interact with generation replacement. |

Installed dependency inspection: `mobile/node_modules/react-native-pager-view/ios/PagerView.swift`
uses `TabView`, `ForEach(props.children)`, and `.id(props.children.count)`.
Changing the page count therefore changes the SwiftUI view identity. This is a
code-level reason not to assume that dynamically appending children to the
current pager preserves motion. No append experiment was performed.
`PagerScrollDelegate.swift` supplies the native state callback timing discussed
in the findings. These dependency files are not modified.

Related design context:

- [Calendar architecture](../../mobile/architecture-book/calendar.md).
- [Active local timed-event design](../../../openspec/changes/render-local-timed-calendar-events/design.md),
  whose bounded three-page query/presentation contract would need an explicit
  revision if this direction is implemented.
- [Existing paging device checklist](../../react-native-migration/inbox/2026-09-12-calendar-week-paging-device-pass.md).

## Options and shortcuts

A persistent native scrolling list with reusable week views is the first
candidate to evaluate, not a selected implementation. Fixed-width weeks allow
known page geometry. React Native's
[virtualization documentation](https://reactnative.dev/docs/virtualizedlist)
explains bounded rendering, but also warns that fast scrolling can outrun the
fill rate and display blank content. Its
[list optimization guide](https://reactnative.dev/docs/optimizing-flatlist-configuration)
describes known item layouts and the rendering/memory tradeoff. A component swap
alone does not establish the desired behavior.

The evaluation must show how navigation remains possible beyond the initial
window, how new content becomes available during movement, and how coordinates
and view identities stay stable. If the existing abstractions cannot do that,
an owned gesture surface or native implementation would require a separate
tradeoff assessment. Neither alternative has been evaluated or approved here.

Insufficient shortcuts:

- More fixed pages: delays the same boundary.
- Faster animations: shrinks the reproduction window without removing it.
- Queuing swipes until idle: still forces the user to wait and complicates
  reversal instead of giving direct control.
- Removing only the idle check: can accept an abandoned destination and replace
  the pager under an active finger.
- Removing generation guards indiscriminately: allows stale completions to
  overwrite newer movement.
- Rendering or retaining all weeks: unbounded work/memory is not a durable fix.
- Hiding Reanimated warnings: does not supply a missing destination page.

## Resume questions and proof

Before choosing a component, define whether a fast fling may cross several weeks
and how the title follows a partially visible week. Also decide the supported
date domain, prefetch policy in both directions, cold-data presentation, memory
budget, and interruption behavior for Today, day/week changes, rotation, app
backgrounding, accessibility, and reduced motion.

When implementation is requested, start with a bounded device experiment for
the scrolling mechanism, then integrate event loading and settlement. Required
evidence includes:

- Sustained rapid swipes well beyond the initial window, in both directions,
  with the next touch beginning before the previous animation completes.
- Immediate reversal, interrupted settlement, and cancelled partial drags with
  no obsolete completion snapping the user back.
- No pager remount, visible jump, or lost touch during ordinary page acceptance
  or offscreen view recycling.
- Correct date/header/event identity under out-of-order data completion.
- Dense event weeks and constrained data preparation, with bounded memory after
  hundreds of weeks and no misleading empty-week presentation.
- Horizontal paging alongside vertical scrolling and pinch zoom, with vertical
  position preserved.
- Screen-reader navigation and reduced motion, plus geometry/configuration
  changes and background/foreground interruption.
- iPhone measurements in a representative build without console diagnostics;
  Android verification before claiming platform-wide behavior.

No prototype or broader paging implementation is part of the current task.
