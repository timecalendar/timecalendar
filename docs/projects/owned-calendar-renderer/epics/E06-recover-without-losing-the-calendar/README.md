---
kind: epic
id: E06
status: planned
traces-to: [P01, P02, P03, P04, P06, D01, D02, D06, D08]
depends-on: [E05]
---

# E06 — Recover from failures without losing Calendar access

## Outcome

Calendar stays usable through local read failures, renderer failures and event removal races.

## Demonstration

Inject a local read error and retry, inject a visual renderer fault and use the chronological recovery, then remove an event during focus/details opening.

## Definition of done

Every contained ticket has passing scoped checks, recorded owner QA/feedback resolution, explicit
acceptance and a merged revision. Earlier accepted bricks still pass their affected checks.
The epic demonstration works without a vendor fallback or hidden additional implementation.
Open product-wide measurements remain explicitly attached to later tickets, never implied passed.

## In scope

The following ordered tickets each deliver one independently reviewable visible result.
The epic groups related value; it is not a request to implement all of them before owner testing.

## Out of scope

Changing the sync engine, adding a fallback vendor renderer or declaring launch readiness.

## Risks and boundaries

Preserve P01–P08 and approved D01–D08. Low-confidence tickets contain a concrete early experiment
and stop condition. If a slice grows, split it and update the canonical order before coding more.
Use [delivery.md](../../delivery.md) for owner QA, merge and evidence gates; changing this epic’s
observable outcome requires explicit owner review.

## Tickets

- [T21 — Retry a failed local read without losing valid events](./T21-local-read-recovery.md) — medium confidence.

- [T22 — Keep an accessible schedule if the timeline fails](./T22-renderer-failure-recovery.md) — medium confidence.

- [T23 — Handle an event disappearing during use](./T23-removed-event-focus.md) — medium confidence.
