---
kind: ticket
id: T04
epic: E01
status: planned
traces-to: [P01, P02, P07, D01, D02, D04]
depends-on: [T03]
size: M
confidence: high
---

# T04 — Read seven dated columns and hide weekends

## Outcome

The empty week has dated Monday-to-Sunday columns and a persistent Show weekends setting.

## Scope

- Lay out one complete week with localized weekday/date headers and a non-color Today cue.

- Add Settings > Calendar > Show weekends, enabled by default and persisted through the existing settings seam.

- Hide Saturday/Sunday by weekday identity in week mode; retain seven-day page stepping and explicit week-start policy.

## Non-goals

Day-mode switching, event blocks, agenda redesign or a configurable week start.

## Dependencies and delivery order

Technical prerequisites: T03. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: the empty week has dated Monday-to-Sunday columns and a persistent Show weekends setting.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test civil-week boundaries, width distribution, weekend identity, default/persisted setting and unchanged agenda dates.

- Verify header/grid alignment in French and English at narrow widths.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent starts at the week of 2026-09-14 and provides the Settings entry. Use both languages and a restart of the test app.

- [ ] See Monday through Sunday with the correct dates; swipe and confirm the next complete week.

- [ ] Turn Show weekends off: five columns remain and each column/header stays aligned.

- [ ] Restart the app: the setting persists. Turn it back on: Saturday and Sunday return.

- [ ] Check French and English labels, including a week crossing a month boundary.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/day-key.ts`

- `mobile/src/features/settings/prefs`

- `mobile/src/features/settings/ui/settings-screen.tsx`

- `mobile/src/app`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M because the visible columns need one persisted Settings integration. High confidence in the existing preference/route seams; no new runtime dependency.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
