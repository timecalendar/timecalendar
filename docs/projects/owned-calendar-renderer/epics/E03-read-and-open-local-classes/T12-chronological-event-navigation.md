---
kind: ticket
id: T12
epic: E03
status: planned
traces-to: [P01, P02, P04, D02, D05, D06]
depends-on: [T11]
size: M
confidence: low
---

# T12 — Navigate the populated calendar accessibly

## Outcome

A person using a screen reader, voice or switch controls can reach the current timed classes once in chronological order, including off-viewport events.

## Scope

- Complete one ordered native event tree tied to the committed model, with bounded reachability beyond visually mounted tiles.

- Preserve focus by event identity across paging/mode changes and otherwise use the relevant date heading; announce settled context once.

- Verify visible and semantic targets share meaningful activation geometry; include existing page and zoom alternatives, full labels and largest-text behavior.

- If the approved tree cannot satisfy the contract, stop this slice, document the failure and request the scoped D06 revision before adding a different strategy.

## Non-goals

A separate agenda destination for accessibility, duplicate hidden focus trees, or final all-day/failure accessibility acceptance.

## Dependencies and delivery order

Technical prerequisites: T11. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a person using a screen reader, voice or switch controls can reach the current timed classes once in chronological order, including off-viewport events.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Automate chronological order/content independent of zoom, no duplicate identities, recycling focus and logical fallback.

- Perform recorded native VoiceOver/TalkBack, Voice Control and Switch Control checks with offscreen/dense fixtures; reduce uncertainty before accepting the slice.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies a script and fake events at 01:00, 10:00 and 23:00 plus the overlap fixture. Enable the relevant assistive tool on the agreed device; record missing platform passes for explicit follow-up.

- [ ] Move through the calendar: hear each reachable timed event in date/time order once.

- [ ] Reach the 01:00 and 23:00 events even when their tiles begin outside the viewport.

- [ ] Zoom and change mode: reading order and complete labels do not change.

- [ ] Use page and zoom controls without swiping or pinching.

- [ ] Activate an event with voice/switch controls: the intended visible class opens.

- [ ] Return to Calendar after details/paging: focus lands on the surviving event or relevant date heading.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen.tsx`

- `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx`

- `docs/mobile/architecture-book/accessibility.md`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M scope but low confidence in bounded offscreen native semantic reachability and activation geometry. Raise confidence through an early populated native probe within this ticket; do not implement further dependent content while it fails.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
