---
kind: ticket
id: T22
epic: E06
status: planned
traces-to: [P01, P04, P06, D02, D06, D08]
depends-on: [T21]
size: M
confidence: medium
---

# T22 — Keep an accessible schedule if the timeline fails

## Outcome

An unexpected timeline rendering failure leaves a same-date chronological schedule and retry usable on Calendar.

## Scope

- Place the visual renderer under an error boundary whose chronological recovery data/labels/actions live outside its failure subtree.

- Expose same-date full event meaning, details activation and retry without a blank screen or competing normal-mode semantic trees.

- Recover to the owned grid coherently and restore meaningful focus.

## Non-goals

A vendor fallback, permanent separate calendar destination or a second rendering engine.

## Dependencies and delivery order

Technical prerequisites: T21. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: an unexpected timeline rendering failure leaves a same-date chronological schedule and retry usable on Calendar.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Inject render failure after a valid committed model, verify recovery tree independence and retry success/failure.

- Record screen-reader activation/focus and no event-content leakage through crash reporting.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies a fake-data build with visual-subtree fault injection and exact trigger/reset instructions outside production UI.

- [ ] Trigger the fault: Calendar shows the same date’s chronological schedule and retry.

- [ ] Read and open an event using assistive controls: complete information is still available.

- [ ] Retry: the owned grid returns on the same date without duplicate focus targets.

- [ ] Repeat a failed retry: recovery controls remain usable.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/ui/calendar-screen.tsx`

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/agenda.ts`

- `mobile/src/firebase`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: recovery must not share the crashing subtree or lose semantics. Medium confidence until native failure-mode operation is recorded.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
