---
kind: ticket
id: T07
epic: E03
status: done
traces-to: [P02, P03, D05]
depends-on: [T05]
size: M
confidence: high
---

# T07 — Frozen per-page presentation cache

## Outcome

Each page's tiles, overlap columns, formatted labels, accessibility labels and order, and header parts are built once per page key in one pass, frozen, and kept in a 16-page LRU with cached formatters.

## Scope

- Move per-render work out of `CalendarTiles` and the header.
- Remove the double `buildCalendarTimelinePresentation` call.

## Non-goals

- The zoom-dependent conflict plan stays in the page component.

## Definition of done

- Tests prove one build per page key and LRU bounds.

## Acceptance and verification

- `npm test -- --coverage`.

## Likely work sites and reading

- `mobile/src/features/calendar/data/timeline-presentation.ts`
- `mobile/src/features/calendar/data/timeline-presentation-hook.ts:64-83`
- `mobile/src/features/calendar/data/format.ts`
- `mobile/src/features/calendar/data/accessibility-projection.ts`
- `mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx:508-538`

## Size and confidence drivers

Existing pure builders are reused.

## QA and sensitive surfaces

Labels and checklist progress must match current output.
