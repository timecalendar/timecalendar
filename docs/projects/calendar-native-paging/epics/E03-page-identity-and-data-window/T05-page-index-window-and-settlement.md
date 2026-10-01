---
kind: ticket
id: T05
epic: E03
status: done
traces-to: [P01, P03, D02, D03, D07]
depends-on: []
size: M
confidence: high
---

# T05 — Page index, window plan and settlement reducer

## Outcome

`calendar/data` exports pure functions for `EpochDay` page identity per mode, the ±260-page content window with re-base planning, the mounted window, and the settled-index reducer.

## Scope

- Index↔anchor for day and week modes, `firstWeekday`, display zone, DST.
- Window and re-base planning; settlement reduction with geometry and re-base epochs.

## Non-goals

- Renderer integration.

## Definition of done

- Unit tests at 90% branch coverage, including DST transitions and re-base boundaries.

## Acceptance and verification

- `npm test -- --coverage`.

## Likely work sites and reading

- `mobile/src/features/calendar/data/week-transition.ts`
- `mobile/src/features/calendar/data/range-plan.ts`
- `mobile/src/features/calendar/data/day-key.ts`
- `mobile/src/features/calendar/data/week.ts`
- research/R04-data-window-and-presentation.md §2, §7

## Size and confidence drivers

Pure logic with a worked design.

## QA and sensitive surfaces

None.
