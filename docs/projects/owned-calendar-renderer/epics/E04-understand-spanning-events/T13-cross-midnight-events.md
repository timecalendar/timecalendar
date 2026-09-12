---
kind: ticket
id: T13
epic: E04
status: planned
traces-to: [P01, P03, P04, D01, D05, D06]
depends-on: [T12]
size: M
confidence: high
---

# T13 — Follow a timed event across midnight

## Outcome

A timed event spanning ordinary local midnights appears on every covered date and each segment opens the same event.

## Scope

- Clip timed intervals to covered local dates with exclusive ends and continuation cues.

- Retain long events as intervals and expand only the requested date window; duration never implies all-day.

- Reuse full accessible time range and original identity in all segments; include segment-level overlap layout.

## Non-goals

Daylight-saving offset-change geometry, all-day presentation and agenda multi-day grouping.

## Dependencies and delivery order

Technical prerequisites: T12. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a timed event spanning ordinary local midnights appears on every covered date and each segment opens the same event.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Prove segment coverage/conservation, exclusive-midnight end, original identity and range-query inclusion of events that started before the visible page.

- Test more-than-24-hour timed input and bounded expansion over a very long interval.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent seeds 2026-09-14 23:00 to 2026-09-15 02:00 Paris, an event ending exactly midnight, and a 30-hour timed event.

- [ ] See the 23:00–midnight segment Monday and midnight–02:00 segment Tuesday.

- [ ] Read continuation cues and full accessible time range; either segment opens the same details.

- [ ] The midnight-ending event does not appear as a phantom event on the next day.

- [ ] The 30-hour event remains in the timed grid rather than moving to all-day.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/day-key.ts`

- `mobile/src/features/calendar/data/events.ts`

- `mobile/src/features/calendar/data/overlap-layout.ts`

- `mobile/src/features/calendar/renderer`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: shared interval segmentation and visible continuation with known input semantics. High confidence for ordinary midnights; the distinct DST problem is isolated in T14.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
