---
kind: decision
id: D01
status: approved
traces-to: [P01, P03, P06]
supersedes: []
---

# D01 — Use a validated calendar domain without rewriting stored events

## Context and evidence

`CalendarEvent` combines Date boundaries with an allDay flag; the existing range predicate
uses instant intersection for both. Agenda groups only by start day, and overlap ties use input
position. The iCal parser deliberately encodes date-only input in UTC fields. See the
[system audit](../research/technical-system-audit.md).

## Options considered

- Preserve the current rendering type: least churn, but permits invalid all-day/timed combinations
  and repeats divergent coverage rules.
- Rewrite server/storage contracts: explicit dates end to end, but expands importer and sync risk
  without current evidence that persisted facts need changing.
- Decode existing storage into a discriminated validated rendering domain: recommended.

## Decision

Keep writes and wire contracts intact. At the local read boundary produce timed instant intervals
or all-day civil-date intervals, with stable event identity. Share validation, coverage, sorting
and label inputs between timeline and agenda. Keep deterministic modules pure under calendar/data;
revalidate existing utilities rather than grandfathering their behavior. Apply visibility, hiding
and cancellation before presentation. Preserve rich event-details ownership.

## Tradeoffs and consequences

The internal API may break across callers, including Home data readers, so migration and consumer
checks must be coordinated. A rendering projection cannot prove every provider's date encoding;
fabricated import fixtures must cover each existing path. DST geometry remains an explicit
unresolved subproblem in the design and cannot inherit endpoint subtraction.

## Approval

Approved by the product owner on 2026-09-12 in this project's continuation conversation:
“I hereby approve all decisions.” The owner explicitly included D04–D06 and directed that their
behavior be tested during implementation, one small ticket at a time, with owner QA, feedback,
acceptance and merge before the next ticket. This replaces the earlier pre-implementation
measurement gate; it does not claim measurements exist or waive the final product contract.

The approved architecture is the starting direction. An implementation failure is investigated
in the affected ticket. Changing an approved boundary or weakening a product requirement needs
an explicit decision update; ordinary tuning within the boundary can follow ticket QA feedback.
