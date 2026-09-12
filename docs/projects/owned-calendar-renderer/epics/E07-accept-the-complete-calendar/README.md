---
kind: epic
id: E07
status: planned
# prettier-ignore
traces-to: [P01, P02, P03, P04, P05, P06, P07, P08, D01, D02, D03, D04, D05, D06, D07, D08]
depends-on: [E06]
---

# E07 — Accept the complete calendar on supported devices

## Outcome

The complete calendar has accepted workload, readability, release performance, resource and human-device evidence, ready for wider launch checks.

## Demonstration

Inspect realistic fabricated fixtures, accept readability values, review release latency/resource reports, complete the human device matrix and verify the final evidence index.

## Definition of done

Every contained ticket has passing scoped checks, recorded owner QA/feedback resolution, explicit
acceptance and a merged revision. Earlier accepted bricks still pass their affected checks.
The epic demonstration works without a vendor fallback or hidden additional implementation.
Open product-wide measurements remain explicitly attached to later tickets, never implied passed.

## In scope

The following ordered tickets each deliver one independently reviewable visible result.
The epic groups related value; it is not a request to implement all of them before owner testing.

## Out of scope

Store submission, deployment, rewriting the wider migration or blanket acceptance of known defects.

## Risks and boundaries

Preserve P01–P08 and approved D01–D08. Low-confidence tickets contain a concrete early experiment
and stop condition. If a slice grows, split it and update the canonical order before coding more.
Use [delivery.md](../../delivery.md) for owner QA, merge and evidence gates; changing this epic’s
observable outcome requires explicit owner review.

## Tickets

- [T24 — Inspect realistic fabricated workload sizes](./T24-representative-fixtures.md) — low confidence.

- [T25 — Accept readability, zoom and dense-event presentation](./T25-readability-and-density.md) — medium confidence.

- [T26 — Accept fast entry and date navigation in release builds](./T26-interaction-latency.md) — medium confidence.

- [T27 — Keep a long calendar session bounded](./T27-bounded-long-session.md) — medium confidence.

- [T28 — Complete the human device and accessibility matrix](./T28-human-device-acceptance.md) — medium confidence.

- [T29 — Prove the owned calendar is ready for wider launch checks](./T29-release-readiness.md) — high confidence.
