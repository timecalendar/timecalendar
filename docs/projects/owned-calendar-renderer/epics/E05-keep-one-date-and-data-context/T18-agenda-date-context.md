---
kind: ticket
id: T18
epic: E05
status: planned
traces-to: [P01, P02, P03, D01, D02]
depends-on: [T17]
size: M
confidence: medium
---

# T18 — Carry the active date through agenda

## Outcome

Agenda and day/week share the intended active date, and spanning events appear in every covered agenda section.

## Scope

- Reuse validated coverage for timed/all-day agenda sections while preserving the existing list presentation and omitting empty dates.

- Report the section nearest the top as agenda’s active date; implement the approved timeline→agenda→timeline rules.

- Route Today/deep links to agenda sections without changing mode; preserve saved timeline zoom/clock state while agenda scrolls.

- Handle a target date with no section deterministically without inventing a separate date-selection UI; retain requested date context and use the next available section in view when one exists.

## Non-goals

Agenda redesign, weekend filtering of agenda, a new date-selection interaction or a general list framework.

## Dependencies and delivery order

Technical prerequisites: T17. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: agenda and day/week share the intended active date, and spanning events appear in every covered agenda section.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test the complete product section 6 transfer table, empty dates, multi-day coverage, scroll callbacks and stale section-jump completions.

- Keep existing list/details/checklist/three-journey regression evidence. If missing-section presentation exposes a new product choice, surface it rather than infer hidden behavior.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies current-week, non-current-week, empty-day, weekend and multi-day fixtures. Start with a populated current week.

- [ ] Enter agenda from the current week: it targets today. From another week: it targets that week’s first date context.

- [ ] Scroll agenda until another date section is nearest the top; switch to day/week and confirm that context is used.

- [ ] Check a spanning event appears on every covered date and empty dates have no invented sections.

- [ ] Turn weekends off in week mode: agenda still contains weekend events.

- [ ] Use Today/a deep link in agenda: agenda stays selected; return to timeline and confirm zoom is preserved.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/agenda.ts`

- `mobile/src/features/calendar/ui/agenda-list.tsx`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- `mobile/.maestro/helpers/open-calendar-agenda.yaml`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: a presentationally small integration crosses SectionList scroll state and shared navigation. Medium confidence in missing-section and callback races; automated transfer tables retire them.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
