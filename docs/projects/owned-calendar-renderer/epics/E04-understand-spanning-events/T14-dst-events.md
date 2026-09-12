---
kind: ticket
id: T14
epic: E04
status: planned
traces-to: [P01, P03, P04, P07, D01, D04, D06]
depends-on: [T13]
size: M
confidence: low
---

# T14 — Read classes through daylight-saving clock changes

## Outcome

Timed events on clock-change dates remain visible, correctly identified and usable on the familiar 24-hour wall-clock grid.

## Scope

- Resolve spring gaps and repeated-hour backward clock endpoints with deterministic display pieces/collision handling, preserving original instants and identity.

- Use fabricated expected-result tables before coding the geometry; no negative-height rectangles, invented repeated-hour row or silently dropped valid event.

- Keep date navigation, full accessible ranges and event activation correct in Paris/New York and an unchanged Tokyo control case.

- Surface any irreconcilable product contradiction immediately and pause this ticket before changing the domain or visual contract.

## Non-goals

Changing the product to an elapsed-time grid, extra hour row, per-event timezone UI or provider data correction.

## Dependencies and delivery order

Technical prerequisites: T13. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: timed events on clock-change dates remain visible, correctly identified and usable on the familiar 24-hour wall-clock grid.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Property-test segmentation around zone offsets and assert positive drawable pieces, stable collisions/identity, and complete covered-date semantics.

- Inspect exact expected geometry for a fall-back event whose displayed end clock time precedes its start and for a spring-forward spanning event.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent provides fixed UTC inputs and a plain-language expected screenshot/label table for Paris 2026-03-29 and 2026-10-25, equivalent New York transition fixtures and Tokyo controls. The device system zone can supply New York/Tokyo without expanding the app’s curated picker.

- [ ] Open the spring-forward date: the missing hour remains an ordinary empty hour and valid event pieces remain reachable.

- [ ] Open the fall-back backwards-end case: see usable pieces rather than a missing or upside-down block.

- [ ] Open both repeated-hour events: their details preserve the correct original instants and identities.

- [ ] Page away/back and switch modes: dates/layout remain deterministic.

- [ ] Check the agent’s expected-case table in all three zones; report any confusing representation before acceptance.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/day-key.ts`

- `mobile/src/features/calendar/data/time-grid.ts`

- `mobile/src/features/calendar/data/overlap-layout.ts`

- `mobile/src/features/calendar/renderer`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M, low confidence: wall-clock projection is non-monotonic at fall-back. The initial expected-case experiment must resolve the display before expanding code; an incompatible requirement triggers a decision, not a workaround.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
