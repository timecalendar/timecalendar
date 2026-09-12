---
kind: ticket
id: T08
epic: E02
status: planned
traces-to: [P01, P02, P05, D01, D02, D08]
depends-on: [T07]
size: S
confidence: high
---

# T08 — Find the current time when opening Calendar

## Outcome

A fresh timeline opens around the current clock time and shows a current-time indicator with a non-color cue.

## Scope

- Use the effective display timezone and position current time around 30% from the viewport top, clamped to the full-day bounds.

- Update the indicator only at displayed precision while relevant/foreground, and recompute on foreground/day rollover.

- Preserve accepted mode/zoom rules; do not restore old process scroll offsets or choose the initial position from events.

## Non-goals

Today button/direct date intent implementation, event-aware auto-scroll and continuous idle animation.

## Dependencies and delivery order

Technical prerequisites: T07. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a fresh timeline opens around the current clock time and shows a current-time indicator with a non-color cue.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Use an injected clock to prove fresh positioning, day boundaries, non-today visibility and foreground timer cleanup.

- Check that leaving/backgrounding Calendar cancels unnecessary recurring work.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies deterministic morning/late-night clock scenarios through test support and a normal real-clock build.

- [ ] Open Calendar fresh: current time is visible with some preceding-hour context.

- [ ] At late-night/early-morning bounds: the indicator remains reachable without scrolling past the day.

- [ ] Switch away/background and return: current time is correct without resetting an already mounted viewport unnecessarily.

- [ ] Check light/dark appearance: the indicator and Today cue do not rely on color alone.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/time-grid.ts`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

S: small visible indicator using accepted geometry and effective-zone helpers. Known clock injection and cleanup patterns give high confidence.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
