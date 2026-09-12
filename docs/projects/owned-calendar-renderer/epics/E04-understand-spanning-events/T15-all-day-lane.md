---
kind: ticket
id: T15
epic: E04
status: planned
traces-to: [P01, P03, P04, D01, D04, D06]
depends-on: [T14]
size: M
confidence: medium
---

# T15 — Read single-day and spanning all-day events

## Outcome

Date-only all-day events appear above the timed grid on exactly the named dates, including spans across a week boundary.

## Scope

- Decode explicit all-day date ranges from the established stored representation; validate exclusive end and skip zero-day ranges.

- Render a bounded collapsed lane with stable span placement and date-specific hidden counts; introduce the count action together with a minimal working expansion so no visible no-op ships.

- Keep complete all-day labels, original-identity activation and named dates independent of display timezone.

- Select initial collapsed row count in owner QA; expanded scrolling/gesture/collapse completion is T16.

## Non-goals

Provider-specific timezone-bearing all-day types, inference from duration, or final lane-density tuning.

## Dependencies and delivery order

Technical prerequisites: T14. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: date-only all-day events appear above the timed grid on exactly the named dates, including spans across a week boundary.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Verify date-only coverage across UTC offsets, exclusive ends, zero-day isolation, multi-week spans and per-date hidden counts.

- Keep malformed all-day input from blanking timed events; compare fabricated importer paths without rewriting stored facts.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent seeds a single-day Monday all-day event, a Monday–Wednesday-exclusive span, a Sunday→Tuesday span across pages and a zero-day invalid row. Keep count below initial collapse capacity for the main demo; separately demonstrate the count action’s basic expansion.

- [ ] Read all-day events above the timed grid on the expected dates.

- [ ] The Monday–Wednesday-exclusive event covers Monday/Tuesday only.

- [ ] Change display zone: named all-day dates stay the same while timed events may move.

- [ ] Open any span segment: the same all-day event details appear.

- [ ] The invalid all-day row is absent and ordinary timed classes remain visible.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/types.ts`

- `mobile/src/features/calendar/data/day-key.ts`

- `mobile/src/features/calendar/data/sync/types.ts`

- `mobile/src/features/calendar/renderer`

- `server/src/modules/fetch/parsers/parse-ical.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: date-only semantics are established but span/row presentation needs owner validation. Medium confidence; dense lane interaction remains a separate brick.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
