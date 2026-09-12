---
kind: ticket
id: T19
epic: E05
status: planned
traces-to: [P02, P03, P04, P07, D01, D02, D06]
depends-on: [T18]
size: M
confidence: medium
---

# T19 — Keep complete context when display settings change

## Outcome

Locale, timezone, theme and text-size changes replace Calendar coherently while preserving the approved date and viewport context.

## Scope

- Unify locale/zone/theme/font-scale/window changes in the committed presentation revision, building complete labels/events/geometry together.

- Cancel/settle active gestures and preserve mode, civil selected date/week, zoom and visible clock position.

- Retain all-day named dates, timed instant projection and stable focus; large text may simplify visuals without losing operations/content.

## Non-goals

New supported locales/calendar systems, per-event timezones or broad theme redesign.

## Dependencies and delivery order

Technical prerequisites: T18. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: locale, timezone, theme and text-size changes replace Calendar coherently while preserving the approved date and viewport context.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test change combinations during gestures, queries and pending navigation; assert no mixed-environment snapshot or obsolete commit.

- Record populated orientation/resize regression and largest-text native focus/label behavior.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent seeds timed and all-day events around midnight and provides precise expected dates for Paris/New York/Tokyo; use system-zone selection where the app picker lacks a zone.

- [ ] Change timezone: timed events move correctly; date-only all-day names do not.

- [ ] Change language/theme: a complete new scene appears without mixed labels/colors.

- [ ] At non-default zoom in afternoon, change font size/rotate: selected date/mode/clock context survives.

- [ ] Change a setting during a drag: it settles or cancels predictably and keeps accessible focus meaningful.

- [ ] Use largest text: every required operation and full event meaning remains reachable.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- `mobile/src/features/settings/prefs`

- `mobile/src/i18n`

- `mobile/src/theme`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: one environment-continuity contract with several inputs. Medium confidence; reuse the accepted snapshot path rather than add independent effects per setting.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
