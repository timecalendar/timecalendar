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

- Generalize `data/week-transition.ts` and the coordinator from week-only normalization and
  seven-day stepping to mode-aware day/week transitions. Day pages advance one civil date,
  including Saturday/Sunday when Show weekends is off. Update both platform menus, date headers,
  accessible previous/next labels and one-settlement announcements together.
- Invalidate active/stale page callbacks on mode changes; retain three pages and continuous header
  projection. Keep the existing Today/focusDate entry points coherent with day mode without
  expanding into T17's complete direct-intent/current-time contract.
- Add validated mode keys/parsers through settings and `mobile/src/storage`; preserve mode across
  backend reset. Fresh day selects today; fresh week selects its containing Monday-first week.
  Initial current-time scrolling is T08. Agenda transfer remains T18.

## Non-goals

Complete Today/deep-link intent semantics and current-time scrolling (T17/T08), agenda
active-section feedback and zoom. Existing navigation must remain coherent with the selected mode.

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

- [ ] Switch mode during a partial page drag: no stale date commit; page across a weekend with weekends hidden and confirm day mode still shows Saturday/Sunday.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Baseline and regression checks

Use [E01 completion and implementation baseline](../../research/results/E01/completion.md).
Preserve native pager/header synchronization, three-page retention, one vertical scroll owner,
weekend preferences and Agenda/details access. Run affected screen/renderer/repository-contract
suites; update milestone-specific assertions only for this ticket's new behavior.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx`

- `mobile/src/features/settings/prefs`

- `mobile/src/storage`

- `mobile/src/features/calendar/data/week-transition.ts`

- `mobile/calendar-owned-shell.contract.test.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and fetched `origin/main` at
`d293988e9dbf64a592388c8796e816fe65f49e46` on 2026-09-14. New owned modules/tests belong under
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
