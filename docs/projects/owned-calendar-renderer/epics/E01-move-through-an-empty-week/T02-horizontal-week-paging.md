---
kind: ticket
id: T02
epic: E01
status: planned
traces-to: [P02, P04, P05, D02, D04, D05, D06]
depends-on: [T01]
size: M
confidence: medium
---

# T02 — Swipe one empty week at a time

## Outcome

A horizontal swipe moves the empty calendar exactly one week and updates its settled heading once.

## Scope

- Build horizontal gesture paging on the owned shell using the approved motion stack and explicit Monday-first policy input.

- Keep the previous settled heading during finger-held movement; commit page/date/heading together and discard stale completions.

- Keep only the current page, immediate neighbours and one pending replacement generation; expose labelled previous/next screen-reader actions on the adjustable canvas and one settled announcement.

- Capture first focused paging/frame/retained-page evidence for D04/D05; tune the slice rather than create a second prototype by default.

The native month/year title is the sole page header. There is no secondary full-date row
or visible arrow toolbar. Development-only labels, measured viewport bounds, and stable
week tints make dragging and settling observable; T04 places dated weekday labels in the
columns beneath the native title.

## Non-goals

Hour grid, day columns, vertical scroll, event content, pinch and far-date navigation controls.

## Dependencies and delivery order

Technical prerequisites: T01. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a horizontal swipe moves the empty calendar exactly one week and updates its settled heading once.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test one-fling/one-page, reversal/cancellation, repeated accessibility-action delivery, week arithmetic across month/year/DST boundaries and stable retained page count.

- Record held-drag and rapid-swipe native behavior; identify active refresh rate if making timing claims.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent opens the empty week at Monday 2026-09-14, with labelled previous/next screen-reader actions and development page markers. Early iOS and Android gesture testing is valuable; record the actual device/build.

- [ ] Drag halfway and hold: the native title and canvas accessibility label still represent the original week.

- [ ] Release to settle: canvas/date context agree on the destination week.

- [ ] Fling quickly: it moves one week, never two or a partial week.

- [ ] Reverse direction repeatedly, then use previous/next: no blank page, wrong heading or duplicate announcement.

- [ ] Page forward and back many times: responsiveness does not visibly worsen.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- `mobile/src/features/calendar/data/day-key.ts`

- `mobile/jest/setup-reanimated.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: one visible interaction with a meaningful native gesture/state handoff. Medium confidence until real-device paging and retention traces exist.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
