---
kind: roadmap
status: not-started
---

# Delivery roadmap

## Sequencing principles

This project is gate-driven. Product approval precedes architecture; approved architecture precedes
implementation decomposition; deterministic proof precedes device acceptance; and the owned
renderer must pass its launch contract before the wider React Native cutover.

## Current gate

The project is at the end of product shaping. Discovery is complete enough for review, and the
consolidated product contract is still pending explicit approval. No implementation epic or ticket
is canonical yet.

## Gated sequence

1. Review [product.md](./product.md): approve, revise, pause, or kill.
2. If approved, complete the pre-architecture repository audit and the research that can be done
   without an implemented renderer; preserve later device/release measurements as explicit gates.
3. Compare technical options, write `design.md`, and create project-local `D*` records for every
   implementation-constraining choice.
4. Obtain explicit approval for the technical design and every active `D*` record.
5. Create outcome-oriented `E*` epics and `T*` tickets with traceability, dependencies, size,
   confidence, and acceptance evidence.
6. Run the project readiness review. Implementation begins only after the ready validator passes.
7. Implement and prove the renderer, remove calendar-kit and its patch before launch, then feed the
   evidence into Phase 10 parity and cutover.

## Epic order and dependencies

Not defined. Epic boundaries would depend on unapproved product and architecture decisions.

## Parallel work

After product approval, privacy-safe workload research, current-system audit, device-floor
validation, and design/acceptance research may proceed in parallel where their evidence sources are
independent. Implementation parallelism cannot be determined yet.

## Rollout gates

- Product contract explicitly approved.
- Technical design and every active architecture decision explicitly approved.
- Canonical epics and tickets pass structural and qualitative readiness review.
- Automated deterministic evidence, release profiling, and required human device/accessibility
  evidence pass before renderer completion.
- `@howljs/calendar-kit`, its patch, and adapter are absent from the React Native launch candidate.
- Phase 10 parity and signed release-candidate checks include the owned renderer.

## Replanning notes

The 2026-06 Phase 04 calendar-kit adoption remains historical evidence, not the delivery roadmap for
this replacement. If research contradicts an approved product premise or requires changing an epic
outcome or architecture decision, stop downstream work and return to the relevant approval gate.
