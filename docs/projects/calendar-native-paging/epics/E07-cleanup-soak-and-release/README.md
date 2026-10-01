---
kind: epic
id: E07
status: planned
traces-to: [P03, P05, P06, D07, D08]
depends-on: [E05, E06]
---

# E07 — Cleanup, soak and release evidence

## Outcome

Remaining smells are gone, the soak passes, and a preview build carrying the new paging owner is published with release evidence.

## Demonstration

Soak output (500 crossings and 30 minutes) and a preview build installed by the owner.

## Definition of done

- `evidence/E07-release.md` names the released revision, the soak results and the owner verdict.

## In scope

- Remaining cleanup from R06.
- Soak and release checklist.

## Out of scope

- Store production rollout decisions beyond the preview channel.

## Risks and boundaries

Leftover machinery hides in less-visited paths; R06 is the checklist.

## Tickets

- T14 — Remove remaining renderer smells (`T14-renderer-cleanup.md`)
- T15 — Soak run and preview release with evidence (`T15-soak-and-release.md`)
