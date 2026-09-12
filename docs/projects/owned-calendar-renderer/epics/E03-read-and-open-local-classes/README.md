---
kind: epic
id: E03
status: planned
traces-to: [P01, P02, P03, P04, P05, P06, D01, D02, D04, D05, D06, D08]
depends-on: [E02]
---

# E03 — Read and open local classes

## Outcome

Ordinary local classes are readable, tappable and chronologically accessible, including short and overlapping events.

## Demonstration

Use fabricated local classes offline, open synced/personal details, read malformed/short cases and overlapping columns, then traverse off-viewport events with native assistive tools.

## Definition of done

Every contained ticket has passing scoped checks, recorded owner QA/feedback resolution, explicit
acceptance and a merged revision. Earlier accepted bricks still pass their affected checks.
The epic demonstration works without a vendor fallback or hidden additional implementation.
Open product-wide measurements remain explicitly attached to later tickets, never implied passed.

## In scope

The following ordered tickets each deliver one independently reviewable visible result.
The epic groups related value; it is not a request to implement all of them before owner testing.

## Out of scope

Midnight/DST/all-day cases, background-update recovery and final supported workload calibration.

## Risks and boundaries

Preserve P01–P08 and approved D01–D08. Low-confidence tickets contain a concrete early experiment
and stop condition. If a slice grows, split it and update the canonical order before coding more.
Use [delivery.md](../../delivery.md) for owner QA, merge and evidence gates; changing this epic’s
observable outcome requires explicit owner review.

## Tickets

- [T09 — Read and open a local timed class](./T09-local-timed-event.md) — medium confidence.

- [T10 — Read tiny events and survive malformed content](./T10-short-and-malformed-events.md) — medium confidence.

- [T11 — Read simultaneous classes side by side](./T11-overlap-columns.md) — medium confidence.

- [T12 — Navigate the populated calendar accessibly](./T12-chronological-event-navigation.md) — low confidence.
