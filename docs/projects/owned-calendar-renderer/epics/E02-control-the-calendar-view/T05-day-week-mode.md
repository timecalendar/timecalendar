---
kind: ticket
id: T05
epic: E02
status: planned
traces-to: [P01, P02, D01, D02]
depends-on: [T04]
size: M
confidence: high
---

# T05 — Switch between day and week without losing position

## Outcome

Day and week switch predictably, retain the visible clock position, and remember the chosen mode after restart.

## Scope

- Add one-day geometry using the same owned renderer and revisioned controller.

- Day→week selects the containing week; week→day selects its first day. Preserve vertical clock position.

- Persist day/week/agenda mode per installation; fresh installation defaults to week and restart follows the product fresh-date rule.

## Non-goals

Today/deep-link behavior, agenda active-section feedback and zoom.

## Dependencies and delivery order

Technical prerequisites: T04. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: day and week switch predictably, retain the visible clock position, and remember the chosen mode after restart.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test mode/date transition table, persistence/corrupt preference recovery and preserved clock coordinates.

- Keep existing agenda entry available; do not claim its new bidirectional date behavior before T18.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent starts on an empty week and explains that agenda transfer semantics are scheduled in T18. Scroll to afternoon before switching.

- [ ] Switch week→day: see Monday only, still at the same visible hour.

- [ ] Move to another day and switch day→week: see its containing week.

- [ ] Repeat switching: no intermediate wrong date or mixed columns.

- [ ] Choose day, restart, and confirm day remains selected while its date follows fresh-open rules.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx`

- `mobile/src/features/settings/prefs`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M across view/controller/preferences, using the already accepted paging and geometry contracts. Known implementation seams support high confidence.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
