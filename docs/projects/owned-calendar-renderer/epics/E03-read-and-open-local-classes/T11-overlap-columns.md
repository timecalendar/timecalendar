---
kind: ticket
id: T11
epic: E03
status: planned
traces-to: [P01, P03, P04, P05, D01, D04, D05, D06]
depends-on: [T10]
size: M
confidence: medium
---

# T11 — Read simultaneous classes side by side

## Outcome

Overlapping classes use stable equal-width columns, and tapping a crowded region identifies the intended class unambiguously.

## Scope

- Pack positive-duration intervals by start instant, end instant and stable identity; adjacency does not overlap.

- Calculate complete relevant clusters before clipping to the vertical viewport; preserve column placement while scrolling/zooming.

- Resolve dense/tiny target conflicts without hiding valid events or silently inventing an aggregation threshold; expose an explicit accessible choice if targets cannot be distinct and obtain owner behavior acceptance in this slice.

- Record first populated density/frame/node evidence; larger supported workload calibration remains T24/T25.

## Non-goals

All-day rows, multi-day/DST splitting or declaring final supported density from guessed counts.

## Dependencies and delivery order

Technical prerequisites: T10. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: overlapping classes use stable equal-width columns, and tapping a crowded region identifies the intended class unambiguously.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Property-test deterministic input permutations, adjacency, identical starts/ends, equal widths, non-covering tiles and stable placement after viewport changes.

- Measure density costs using identified fabricated counts and prove effective hit targets do not ambiguously select another event.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent seeds adjacent classes, two/three simultaneous classes, identical starts, and a labelled crowded stress cluster. Seed order can be reversed without changing event identity.

- [ ] See simultaneous classes side by side; none covers another.

- [ ] See back-to-back classes share available width without an artificial overlap gap.

- [ ] Tap each crowded target: the selected details are unambiguous.

- [ ] Scroll and zoom through the cluster: columns do not reshuffle.

- [ ] Reload the same events in another input order: layout stays the same.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/overlap-layout.ts`

- `mobile/src/features/calendar/renderer`

- `mobile/src/test-support/calendar-dense-week.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M with deterministic layout plus a native density/hit-target uncertainty. Medium confidence; reject ambiguous target behavior in this ticket rather than postpone it to final QA.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
