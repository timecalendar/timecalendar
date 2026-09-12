---
kind: ticket
id: T03
epic: E01
status: planned
traces-to: [P01, P02, P04, P05, D02, D04]
depends-on: [T02]
size: M
confidence: medium
---

# T03 — Scroll all 24 hours beside the hour gutter

## Outcome

The empty calendar scrolls vertically through the whole day while horizontal week paging still works.

## Scope

- Add 00:00–24:00 wall-clock geometry, major/minor lines and a left hour gutter aligned with the timed content.

- Keep the gutter horizontally pinned and the date header vertically pinned; hour labels track the same vertical clock positions as the grid.

- Lock one-finger movement to horizontal or vertical movement and cancel presses when movement wins.

- Read the device 12/24-hour preference for hour labels.

## Non-goals

Event tiles, week day columns, pinch, measured final zoom defaults and current-time positioning.

## Dependencies and delivery order

Technical prerequisites: T02. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: the empty calendar scrolls vertically through the whole day while horizontal week paging still works.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test minute/pixel positions, scroll clamps, label format input and axis-lock/cancellation state; cover introduced pure arithmetic fully.

- Capture diagonal/quick reversal interactions on the owned view and confirm no simultaneous axes or settle jump.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies a tall empty grid with known hour labels and the T02 week controls. Start near noon on the agreed owner device.

- [ ] Scroll up to the start of the day and down to its end: the full 24 hours are reachable.

- [ ] Watch the left gutter: labels remain aligned with their lines; the date heading stays visible.

- [ ] Swipe sideways from mid-afternoon: change week while retaining the same visible clock position.

- [ ] Try diagonal gestures: the calendar follows one axis rather than sliding both ways.

- [ ] Change the device between 12-hour and 24-hour display: hour labels follow the preference.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/time-grid.ts`

- `mobile/src/features/calendar/data/format.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: vertical geometry and gesture arbitration interact with the accepted horizontal brick. Native axis-lock behavior is unmeasured.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
