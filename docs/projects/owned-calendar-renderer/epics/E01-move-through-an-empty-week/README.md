---
kind: epic
id: E01
status: planned
traces-to: [P01, P02, P04, P05, P07, P08, D01, D02, D03, D04, D05, D06, D07]
depends-on: []
---

# E01 — Move through an empty calendar week

## Outcome

An empty Calendar can be paged horizontally and scrolled through all hours, with dated week columns and the weekend preference.

## Demonstration

Open the owned shell, swipe a whole week, scroll to an afternoon hour, hide weekends and repeat both scrolls. The owner accepts each of T01–T04 separately.

## Definition of done

Every contained ticket has passing scoped checks, recorded owner QA/feedback resolution, explicit
acceptance and a merged revision. Earlier accepted bricks still pass their affected checks.
The epic demonstration works without a vendor fallback or hidden additional implementation.
Open product-wide measurements remain explicitly attached to later tickets, never implied passed.

## In scope

The following ordered tickets each deliver one independently reviewable visible result.
The epic groups related value; it is not a request to implement all of them before owner testing.

## Out of scope

Event content, mode/zoom changes and final device acceptance.

## Risks and boundaries

Preserve P01–P08 and approved D01–D08. Low-confidence tickets contain a concrete early experiment
and stop condition. If a slice grows, split it and update the canonical order before coding more.
Use [delivery.md](../../delivery.md) for owner QA, merge and evidence gates; changing this epic’s
observable outcome requires explicit owner review.

## Tickets

- [T01 — Open the owned Calendar shell](./T01-owned-calendar-shell.md) — high confidence.

- [T02 — Swipe one empty week at a time](./T02-horizontal-week-paging.md) — medium confidence.

- [T03 — Scroll all 24 hours beside the hour gutter](./T03-vertical-hours-scroll.md) — medium confidence.

- [T04 — Read seven dated columns and hide weekends](./T04-weekday-columns.md) — high confidence.
