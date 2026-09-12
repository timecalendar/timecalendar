# Historical owned calendar renderer discovery index

> Superseded as the active index on 2026-09-10 by the canonical
> [project README](../README.md). The discovery status below is preserved as evidence.

Status: Rounds 1–4 owner answers are recorded and the functional specification has been drafted
for product-owner review. Owner interrogation is wrapped up; bounded research remains. No
functional specification approval, renderer implementation, or architecture decision is
authorized by these documents.

This directory is the working home for the owned React Native calendar renderer project. Its first job is to establish the product contract with the product owner before architecture or implementation begins.

## Document map

1. [Discovery scope and evidence](./discovery-scope-and-evidence.md) records what is confirmed, what was merely observed, where existing sources disagree, and what this discovery may and may not decide.
2. [Functional specification questionnaire](./functional-specification-questionnaire.md) is the row-level source of truth for confirmed, excluded, deferred, research, and architecture-stage decisions.
3. [Round 3 triage and answer record](./round-3-triage-and-owner-questions.md) maps all 187 rows that were unanswered after Round 2 and preserves its historical ELI5 question set and corrections.
4. [Round 4 owner answers and readiness](./round-4-owner-answers-and-readiness.md) records the final owner-grilling pass, corrections to prior assumptions, and the current research/architecture boundary.
5. [Canonical product draft](../product.md) consolidates the confirmed
   product behavior, explicit exclusions, deferrals, and named downstream gates for owner review.
6. [The original implementation prompt](../../../react-native-migration/01-roadmap/owned-calendar-renderer-prompt.md) is retained as historical input. Its proposed requirements and solutions are not approved scope.

The following historical filename sequence has been superseded by the canonical project layout:

- `04-non-functional-requirements.md` after measurable quality and performance budgets are confirmed;
- `05-acceptance-plan.md` after the supported device and accessibility matrix is confirmed;
- `06-architecture-options.md` only after the functional specification is stable;
- `07-architecture-decision.md` only after options have been measured and reviewed;
- `08-delivery-plan.md` only after scope and architecture are approved.

The filenames above reserve a useful sequence; they do not authorize creating those documents or choosing their content without owner input.

## Decision policy

Only an explicit product-owner answer can put product behavior in scope or out of scope. Existing code, tests, Flutter behavior, roadmap prose, OpenSpec artifacts, ADRs, and the legacy prompt are evidence. They are not substitutes for confirmation.

Every future statement must carry one of these statuses until the specification is approved:

- `CONFIRMED_IN`: the product owner explicitly requires it;
- `CONFIRMED_OUT`: the product owner explicitly excludes it;
- `DEFERRED`: deliberately postponed, with a stated revisit point;
- `OBSERVED`: present in a codebase or document but not accepted as future behavior;
- `HYPOTHESIS`: a possible need that must be validated;
- `NEEDS_RESEARCH`: a factual question that requires measurement or investigation;
- `UNANSWERED`: no decision exists.

Silence, existing behavior, an old test, and an unanswered question never mean approval.

## Confirmed for this discovery

- We are preparing the functional scope for an owned React Native calendar renderer.
- We must not infer requirements that the product owner has not confirmed.
- The Flutter implementation is historical evidence, not the product specification or an architecture template.
- Feature correctness, performance, code quality, maintainability, and open-source quality matter.
- The desired engineering posture is to avoid deliberate compromises and known technical debt from the start.
- This session produces documentation and an extensive question backlog, not product code.

Round 2 confirmed the priority order, persistence and navigation rules, week model, all-day
and cross-midnight semantics, accessibility target, initial performance matrix and budgets,
responsibility split, quality/debt gates, and bounded fixture catalog. The questionnaire
continues to make the remaining product and acceptance details explicit instead of inferring
them from those broad decisions.

## Readiness after Round 4 answers

The owner-facing product interrogation is complete enough to stop inventing additional questions.
The questionnaire's 280 unique rows now total 190 `CONFIRMED_IN`, 50 `CONFIRMED_OUT`, five
`DEFERRED`, 29 `NEEDS_RESEARCH`, and six `UNANSWERED`.

The 29 research rows cover privacy-safe user/workload evidence, device and current-failure traces,
zoom/density/contrast tuning, release resource budgets and tooling, and the repository/migration
audit. Some cannot finish until an owned renderer and physical-device release build exist. Missing
measurements are named gates, not permission to fabricate targets or weaken the accepted quality
bar.

The only remaining `UNANSWERED` keys are `PF-021`, `B-006`, `B-010`, `B-011`, `B-012`, and
`B-014`. They concern overscan, renderer API style, final runtime/dependency choices, and
dependency governance. They belong to measured architecture work and should not be pushed back to
the owner as speculative product questions.

The product contract is drafted in [`product.md`](../product.md) and awaits explicit
product-owner approval. Architecture and implementation remain unauthorized until the
specification is approved and the relevant research has been carried forward into non-functional
requirements and acceptance planning.

## Explicitly outside this discovery session

- Implementing, prototyping, or changing the renderer;
- choosing React Native views, Reanimated, Gesture Handler, Skia, Canvas, a fork, or another rendering technology;
- accepting the proposed renderer API in the legacy prompt;
- accepting its performance numbers, page counts, overscan, event-volume targets, or device matrix;
- declaring any current React Native or Flutter behavior a parity requirement;
- removing `@howljs/calendar-kit`, its patch, or its adapter;
- writing a delivery estimate or implementation task breakdown;
- changing the current application behavior.

## How to continue discovery

1. Read the [canonical project README](../README.md) and
   [discovery evidence](./discovery-scope-and-evidence.md) completely.
2. Treat the questionnaire as the row-level source of truth, Round 3 as historical triage, and
   Round 4 as the current owner-answer audit; never restore a superseded recommendation.
3. Complete bounded factual or technical research with agents. Do not ask the owner to provide
   measurements, algorithms, or repository facts.
4. Do not resume broad owner grilling. Ask only if research exposes a genuinely new product choice.
5. Review the functional specification as a separate product-owner approval act; approval of the
   discovery notes alone is not approval of the specification.
6. Keep architecture and implementation proposals out of the functional specification unless the
   product owner explicitly states a technical constraint as a requirement.
