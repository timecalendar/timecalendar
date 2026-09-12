---
kind: epic
id: E05
status: planned
traces-to: [P01, P02, P03, P04, P05, P06, P07, D01, D02, D05, D06]
depends-on: [E04]
---

# E05 — Keep one date and data context across Calendar

## Outcome

Calendar presents one correct date and complete local data context across direct navigation, agenda, environment and completed sync changes.

## Demonstration

Use Today/far links, scroll agenda and return, change display settings, then apply a controlled background update while retaining correct local content.

## Definition of done

Every contained ticket has passing scoped checks, recorded owner QA/feedback resolution, explicit
acceptance and a merged revision. Earlier accepted bricks still pass their affected checks.
The epic demonstration works without a vendor fallback or hidden additional implementation.
Open product-wide measurements remain explicitly attached to later tickets, never implied passed.

## In scope

The following ordered tickets each deliver one independently reviewable visible result.
The epic groups related value; it is not a request to implement all of them before owner testing.

## Out of scope

Local-store failure recovery and visual-subtree crash recovery.

## Risks and boundaries

Preserve P01–P08 and approved D01–D08. Low-confidence tickets contain a concrete early experiment
and stop condition. If a slice grows, split it and update the canonical order before coding more.
Use [delivery.md](../../delivery.md) for owner QA, merge and evidence gates; changing this epic’s
observable outcome requires explicit owner review.

## Tickets

- [T17 — Go to Today or a linked date without losing context](./T17-today-and-direct-date.md) — medium confidence.

- [T18 — Carry the active date through agenda](./T18-agenda-date-context.md) — medium confidence.

- [T19 — Keep complete context when display settings change](./T19-atomic-environment-change.md) — medium confidence.

- [T20 — Apply completed local updates without a calendar refresh state](./T20-atomic-local-updates.md) — medium confidence.
