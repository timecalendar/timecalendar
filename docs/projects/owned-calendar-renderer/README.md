---
kind: project
id: owned-calendar-renderer
status: shaping
decision: pending
---

# Owned calendar renderer

## Intent

Replace the patched `@howljs/calendar-kit` day/week timeline before the React Native launch with
an owned TimeCalendar renderer that is correct, glance-fast, accessible, resource-bounded, and
maintainable without compatibility baggage. Keep Calendar orchestration, local data access,
synchronization, agenda, and event-details navigation outside the timeline boundary.

## State

As of 2026-09-12:

- Product: `draft`; four owner-answer rounds and a follow-up clarification are incorporated, but
  the consolidated contract has not received explicit product-owner approval.
- Technical design: `not-started`; starting it is gated on product approval.
- Project-local architecture decisions: `not-started`; six measured architecture questions are
  already identified.
- Roadmap and tickets: `not-started`; creating implementation epics before the product and
  architecture gates would imply unapproved scope.
- Readiness: `not-implementable`.

The immediate gate is an explicit `approve`, `revise`, `pause`, or `kill` decision on
[product.md](./product.md). Approval authorizes technical investigation and design, not renderer
implementation.

## Position in the React Native migration

The original Phase 04 Calendar work is code-complete around calendar-kit, but it is not the launch
end state now being shaped. This replacement is a reopen/replan of the highest-risk part of
Calendar core and must finish before Phase 10 parity and store cutover can honestly pass. It does
not reopen the already-owned local calendar data, sync, agenda, Home, or event-details work unless
approved design evidence exposes a contradiction.

At the wider roadmap level, the repository documents Phases 01–06 as source-complete with various
physical-device checks still outstanding; Phase 07 is partial; Phase 08 is not yet marked shipped;
the Phase 09 data-migration plan is implementable but not delivered; and Phase 10 contains some
release infrastructure while parity, signed upgrade proof, hardening, and store cutover remain.

## Planning map

- [Product contract](./product.md) — active draft and current approval gate.
- [Technical design](./design.md) — records constraints and open design work without choosing an
  architecture prematurely.
- [Roadmap](./roadmap.md) — records the gate sequence; implementation epics and tickets are
  intentionally absent until approvals exist.
- [Decision index](./decisions/README.md) — architecture decisions that must be created and
  approved during technical design.
- [Epic index](./epics/README.md) — why no implementation decomposition exists yet.
- [Discovery evidence](./research/README.md) — the preserved questionnaire, evidence inventory,
  owner-answer rounds, and historical discovery status.

## Approval log

- 2026-08-27 through 2026-09-07 — the product owner answered four discovery rounds. Those answers
  establish row-level input to the draft contract; they do not approve the consolidated
  `product.md`.
- 2026-09-12 — the owner clarified that Monday is the launch week-start policy rather than a
  permanent renderer invariant, then accepted the distinction between date-only all-day events and
  instant-bounded timed events. The product remains pending consolidated approval.
- No product approval or project-local architecture approval is recorded yet.

## Residual risks and caveats

- Twenty-nine evidence rows still require bounded research. Several need an implemented release
  renderer, physical devices, privacy-safe production aggregation, or opt-in user evidence.
- Six unanswered rows are architecture questions, not additional product questions.
- The exact current calendar-kit failure reproduction and the proposed Galaxy A16 5G performance
  floor still need physical-device evidence.
- The old global migration roadmap still describes the 2026-06 calendar-kit adoption as Phase 04
  completion. Its status is historical for the day/week renderer and must not be mistaken for
  approval of this replacement.
- No renderer implementation, technology choice, compatibility layer, feature flag, dependency
  removal, native configuration change, or release action is authorized by this package.
