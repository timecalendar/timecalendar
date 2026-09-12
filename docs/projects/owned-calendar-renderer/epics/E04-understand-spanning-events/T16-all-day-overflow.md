---
kind: ticket
id: T16
epic: E04
status: planned
traces-to: [P01, P03, P04, P05, D02, D04, D05, D06]
depends-on: [T15]
size: M
confidence: medium
---

# T16 — Expand and scroll crowded all-day events

## Outcome

Per-date “show more” controls expand a bounded all-day lane that scrolls independently and collapses predictably.

## Scope

- Complete date-specific +N counts, whole-visible-period expansion, bounded expanded height and a global collapse action by the gutter.

- Virtualize/cull lane work without losing allowed semantic reachability; lane-start gestures scroll the lane and grid-start gestures scroll the timeline.

- Collapse destination before date/mode settle; expansion is not persisted. If collapse hides focus, restore it to that date’s expansion action.

## Non-goals

Unbounded expanded height, per-date independent expansion or changing all-day semantics.

## Dependencies and delivery order

Technical prerequisites: T15. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: per-date “show more” controls expand a bounded all-day lane that scrolls independently and collapses predictably.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test multi-day per-date hidden counts, expand/collapse focus and date/mode-reset invariants.

- Record all-day/grid/horizontal/pinch arbitration and bounded mounted work with dense fabricated spans.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent seeds more events than collapsed capacity on two dates, including one hidden span counted on both dates. Record chosen row/height limits and use screen-reader mode for focus steps.

- [ ] Verify each date’s +N matches the supplied expected counts.

- [ ] Expand one date: the whole visible period expands within the agreed height.

- [ ] Scroll inside the lane: only lane content moves. Start inside timed content: only the timed grid moves.

- [ ] Focus an expanded event then collapse: focus returns to the relevant show-more action.

- [ ] Page or change mode: the new destination is collapsed before settling.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- `mobile/src/features/calendar/data`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: one lane-interaction outcome with nested gesture and focus uncertainty. Test it now, before state/sync integration adds more interruptions.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
