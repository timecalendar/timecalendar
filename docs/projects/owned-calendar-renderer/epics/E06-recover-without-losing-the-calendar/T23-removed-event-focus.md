---
kind: ticket
id: T23
epic: E06
status: planned
traces-to: [P02, P03, P04, P06, D01, D02, D06]
depends-on: [T22]
size: S
confidence: medium
---

# T23 — Handle an event disappearing during use

## Outcome

An event removed while focused or opening details leads to a predictable accessible destination instead of stale content.

## Scope

- Revalidate identity at activation and after local updates; do not open removed captured objects.

- Keep focus on a surviving event or relevant date heading; keep collapse-specific focus behavior from T16.

- When details are opening/open, show the existing accessible unavailable state or close coherently as the approved contract allows.

## Non-goals

Details redesign, a new selection model or changing editability rules.

## Dependencies and delivery order

Technical prerequisites: T22. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: an event removed while focused or opening details leads to a predictable accessible destination instead of stale content.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test removal before press completion, during route opening, while details is open, and after page recycling.

- Record real native focus after removal with no dangling event target.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent seeds a removable synced event and a personal event and supplies controlled deletion/replacement steps.

- [ ] Focus the event, remove it, and confirm focus moves to the relevant date heading or surviving valid identity.

- [ ] Open details while removal occurs: no stale editable/read-only event appears.

- [ ] Remove an already open event: see a clear accessible unavailable state or a coherent return to Calendar.

- [ ] Navigate afterward: no recycled tile activates the old event.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/event-details.ts`

- `mobile/src/features/calendar/ui/event-details-screen.tsx`

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen.tsx`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

S: a narrowly targeted race/focus completion on existing routes. Medium confidence because native focus timing needs a recorded test.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
