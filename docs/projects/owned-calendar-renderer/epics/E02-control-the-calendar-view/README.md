---
kind: epic
id: E02
status: planned
traces-to: [P01, P02, P04, P05, P07, P08, D01, D02, D03, D04, D06, D07, D08]
depends-on: [E01]
---

# E02 — Control the calendar view on different screens

## Outcome

The owner can choose day/week, zoom, rotate/resize and find the current time without losing the intended viewport.

## Demonstration

Choose day/week, pinch and use menu zoom, rotate/resize a compatible build, then reopen around current time. Each new control is tested before the next is added.

## Definition of done

Every contained ticket has passing scoped checks, recorded owner QA/feedback resolution, explicit
acceptance and a merged revision. Earlier accepted bricks still pass their affected checks.
The epic demonstration works without a vendor fallback or hidden additional implementation.
Open product-wide measurements remain explicitly attached to later tickets, never implied passed.

## In scope

The following ordered tickets each deliver one independently reviewable visible result.
The epic groups related value; it is not a request to implement all of them before owner testing.

## Out of scope

Event presentation, full navigation/agenda integration and final resource baselines.

## Risks and boundaries

Preserve P01–P08 and approved D01–D08. Low-confidence tickets contain a concrete early experiment
and stop condition. If a slice grows, split it and update the canonical order before coding more.
Use [delivery.md](../../delivery.md) for owner QA, merge and evidence gates; changing this epic’s
observable outcome requires explicit owner review.

## Tickets

- [T05 — Switch between day and week without losing position](./T05-day-week-mode.md) — high confidence.

- [T06 — Zoom the grid with pinch and accessible controls](./T06-zoom.md) — medium confidence.

- [T07 — Use the calendar in landscape and resized windows](./T07-resizable-native-calendar.md) — medium confidence.

- [T08 — Find the current time when opening Calendar](./T08-current-time.md) — high confidence.
