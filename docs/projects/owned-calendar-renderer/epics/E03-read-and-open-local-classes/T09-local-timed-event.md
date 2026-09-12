---
kind: ticket
id: T09
epic: E03
status: planned
traces-to: [P01, P03, P04, P06, D01, D02, D05, D06]
depends-on: [T08]
size: M
confidence: medium
---

# T09 — Read and open a local timed class

## Outcome

A valid same-day local class appears at its actual time with title/location and opens the existing event-details screen.

## Scope

- Introduce validated timed/date-only domain tags at the read boundary without rewriting storage; this slice presents only positive-duration, same-day timed events.

- Read the relevant local ranges through the data seam, including source visibility/hidden/cancelled filtering, and publish complete versioned event/page models.

- Render normal title/location tiles, complete accessible labels and original-identity activation; preserve synced read-only/personal editable details and summary checklist progress.

- Keep event work off gesture frames, preserve current bounded pages, and make malformed rows unable to throw across the whole list.

## Non-goals

Overlap packing, instant markers, spanning/DST/all-day presentation or a database/wire-format rewrite. Those event cases have explicit later slices.

## Dependencies and delivery order

Technical prerequisites: T08. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a valid same-day local class appears at its actual time with title/location and opens the existing event-details screen.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test local query predicates, row-level validation, event/date identity, filtering, detail routing and no network calls on page navigation.

- Run affected Home/agenda/details/data-consumer tests when domain signatures change; validate introduced deterministic logic at the required coverage level.

- Measure initial range/retention behavior with fabricated ordinary data; do not claim p50/p95 workload representativeness yet.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent seeds Monday 2026-09-14 10:00–11:00 Europe/Paris with title “Maths” and room “B12”, plus one editable personal event and one hidden/cancelled event. Use a disposable offline test installation.

- [ ] Find Maths in the 10:00–11:00 position with B12 visible.

- [ ] Tap the synced class: its existing details open read-only. Tap the personal event: existing editing remains available.

- [ ] Swipe away and return offline: the class appears on the right date without a network loader.

- [ ] Confirm hidden/cancelled events are absent from both visible tiles and accessible event navigation.

- [ ] Use the screen reader on the normal tile: hear its full title, time range and room once.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/events.ts`

- `mobile/src/features/calendar/data/types.ts`

- `mobile/src/features/calendar/data/sync/hooks.ts`

- `mobile/src/features/calendar/data/sync/types.ts`

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/event-details-screen.tsx`

- `mobile/src/features/home/ui/event-surface.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: the first real data→layout→details slice crosses several existing seams. Medium confidence because bounded reads and domain-consumer migrations need integration evidence; limit to one ordinary event shape.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
