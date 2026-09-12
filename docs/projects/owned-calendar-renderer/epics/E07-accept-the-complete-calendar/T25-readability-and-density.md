---
kind: ticket
id: T25
epic: E07
status: planned
traces-to: [P01, P03, P04, P07, D04, D05, D06, D08]
depends-on: [T24]
size: M
confidence: medium
---

# T25 — Accept readability, zoom and dense-event presentation

## Outcome

The owner can read normal and dense schedules using agreed zoom, event contrast and all-day lane dimensions.

## Scope

- Tune and record final zoom minimum/default/maximum, collapsed lane rows/expanded height and dense target/overlap behavior using T24 fixtures.

- Check source-color adjustment, missing/long text, grid/detail/full-label consistency, device 12/24-hour labels and theme tokens.

- Use the owner-approved visual reference and obtain design sign-off; preserve all required operations at largest text and no unapproved hidden-content aggregation.

- Carry the opt-in usability questions forward as evidence limits rather than inferring prevalence from one reviewer.

## Non-goals

A new calendar layout/product contract, cosmetic redesign of agenda, or skipping accessible content to improve density.

## Dependencies and delivery order

Technical prerequisites: T24. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: the owner can read normal and dense schedules using agreed zoom, event contrast and all-day lane dimensions.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Re-run color/geometry/zoom properties for changed values and record bounded device readability experiments.

- Link the reference asset and approved values; if reference evidence is unavailable, request it before claiming visual sign-off.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies side-by-side normal/dense/worst fixtures, the available approved reference, and a short table of the proposed numeric settings on compact/expanded screens.

- [ ] Find the next class and room quickly in normal and dense schedules.

- [ ] Zoom in/out/reset: short events get clearer and a useful portion of the day is visible when zoomed out.

- [ ] Read long/missing titles and arbitrary event colors in both themes and languages.

- [ ] At largest text, reach every event/action and full event meaning without relying on truncated text.

- [ ] Accept or revise the proposed zoom/lane/density values and visual reference match explicitly.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/format.ts`

- `mobile/src/theme`

- `mobile/src/test-support`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: one product-visible readability sign-off supported by several measured values. Medium confidence; real dense fixtures and human judgment determine the values.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
