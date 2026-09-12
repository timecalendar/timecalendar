---
kind: epic
id: E04
status: planned
traces-to: [P01, P03, P04, P05, P07, D01, D02, D04, D05, D06]
depends-on: [E03]
---

# E04 — Understand events that span dates and clock changes

## Outcome

Events spanning days, clock changes or all-day ranges convey their complete meaning and remain reachable.

## Demonstration

Follow one timed event across dates, inspect DST fixtures, read date-only spans, then expand/collapse and independently scroll a crowded all-day lane.

## Definition of done

Every contained ticket has passing scoped checks, recorded owner QA/feedback resolution, explicit
acceptance and a merged revision. Earlier accepted bricks still pass their affected checks.
The epic demonstration works without a vendor fallback or hidden additional implementation.
Open product-wide measurements remain explicitly attached to later tickets, never implied passed.

## In scope

The following ordered tickets each deliver one independently reviewable visible result.
The epic groups related value; it is not a request to implement all of them before owner testing.

## Out of scope

Agenda integration, new provider semantics and final whole-calendar device acceptance.

## Risks and boundaries

Preserve P01–P08 and approved D01–D08. Low-confidence tickets contain a concrete early experiment
and stop condition. If a slice grows, split it and update the canonical order before coding more.
Use [delivery.md](../../delivery.md) for owner QA, merge and evidence gates; changing this epic’s
observable outcome requires explicit owner review.

## Tickets

- [T13 — Follow a timed event across midnight](./T13-cross-midnight-events.md) — high confidence.

- [T14 — Read classes through daylight-saving clock changes](./T14-dst-events.md) — low confidence.

- [T15 — Read single-day and spanning all-day events](./T15-all-day-lane.md) — medium confidence.

- [T16 — Expand and scroll crowded all-day events](./T16-all-day-overflow.md) — medium confidence.
