---
kind: ticket
id: T06
epic: E02
status: planned
traces-to: [P02, P04, P05, D02, D04, D06]
depends-on: [T05]
size: M
confidence: medium
---

# T06 — Zoom the grid with pinch and accessible controls

## Outcome

Pinch and menu zoom change hour spacing without moving the clock time under the chosen focus point.

## Scope

- Add continuous focal-preserving pinch with two-finger precedence and proper cancellation of one-finger gestures/presses.

- Add zoom in/out/reset using viewport-center clock anchoring; announce/disable measured bounds and persist one shared day/week value.

- Choose initial min/default/max from bounded readability experiments, record owner-tested values in the slice, and revisit with populated density in T25.

## Non-goals

Final populated-event density acceptance, event resizing or per-mode zoom settings.

## Dependencies and delivery order

Technical prerequisites: T05. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: pinch and menu zoom change hour spacing without moving the clock time under the chosen focus point.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Fully cover focal equation, boundary clamps, repeated zoom commands, finger-count changes and persistence with deterministic properties.

- Record native focal stability and pinch/horizontal/vertical arbitration; capture low-end timing when available.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent provides initial zoom values and a marked reference hour near the center. Try pinch plus menu actions on actual touch devices where available.

- [ ] Pinch around the reference hour: it stays under your fingers without a release jump.

- [ ] Try menu zoom in/out: the clock time at the viewport center stays stable.

- [ ] Reach each limit: the matching control disables and communicates the limit.

- [ ] Start scrolling then add a second finger: pinch wins without unintended week movement.

- [ ] Switch day/week and restart: zoom persists; reset returns to the agreed default.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/time-grid.ts`

- `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx`

- `mobile/src/features/settings/prefs`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M with a single interaction outcome but native arbitration risk. Medium confidence; early focal recordings and owner testing resolve it before event-density tuning.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
