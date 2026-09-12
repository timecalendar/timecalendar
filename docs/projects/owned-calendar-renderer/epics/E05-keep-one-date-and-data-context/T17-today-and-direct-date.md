---
kind: ticket
id: T17
epic: E05
status: planned
traces-to: [P02, P04, P05, D01, D02, D05, D06]
depends-on: [T16]
size: M
confidence: medium
---

# T17 — Go to Today or a linked date without losing context

## Outcome

Today and direct-date links land on a complete correct day/week while preserving mode and zoom.

## Scope

- Wire Today and validated civil-date intents through the same revisioned transition protocol; preserve selected mode and zoom.

- Prepare local destination data before settle, including dates years away, and reject stale completions when requests race.

- Today scrolls to current time; reduced motion directly settles and navigation announces the destination once with predictable focus.

## Non-goals

Agenda direct-section integration, new search/date-picker UI or network-bound navigation.

## Dependencies and delivery order

Technical prerequisites: T16. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: today and direct-date links land on a complete correct day/week while preserving mode and zoom.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test valid/invalid deep links, one-time intent consumption, Today/deep-link races, far-range queries, reduced motion and state/content atomicity.

- Record first-correct-frame timing for local far navigation; preserve hard targets while final repeated baselines wait for T26.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent provides buttons/launch instructions for a valid far-date deep link with fabricated local data and an invalid date link. Start on a different week at non-default zoom.

- [ ] Tap Today: mode/zoom stay the same and the current time is visible on the correct date/week.

- [ ] Open the far-date link offline: destination content and heading agree with no network loader.

- [ ] Trigger two date requests quickly: the last valid intent wins; older content cannot overwrite it.

- [ ] Enable reduced motion: Today/link moves settle directly and announce once.

- [ ] Try the invalid date: navigation remains safe without corrupting the current date.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- `mobile/src/features/calendar/data/routes.ts`

- `mobile/src/features/calendar/data/day-key.ts`

- `mobile/src/features/calendar/renderer`

- `mobile/src/app/(tabs)/calendar`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: local query readiness and UI/React settle are meaningful race risks. Medium confidence until targeted rapid-intent traces pass.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
