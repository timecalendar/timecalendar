# Owned calendar renderer discovery

Status: Rounds 1 and 2 are recorded. Discovery continues; no renderer implementation is
authorized by these documents.

This directory is the working home for the owned React Native calendar renderer project. Its first job is to establish the product contract with the product owner before architecture or implementation begins.

## Document map

1. [Discovery scope and evidence](./01-discovery-scope-and-evidence.md) records what is confirmed, what was merely observed, where existing sources disagree, and what this discovery may and may not decide.
2. [Functional specification questionnaire](./02-functional-specification-questionnaire.md) is the decision backlog for future product-owner sessions.
3. [The original implementation prompt](../01-roadmap/owned-calendar-renderer-prompt.md) is retained as historical input. Its proposed requirements and solutions are not approved scope.

Future numbered documents should follow this naming scheme:

- `03-functional-specification.md` after the product questions are answered;
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

## Readiness after Round 2

The blocking first-pass owner decisions are recorded, but the project is not yet ready to
call `03-functional-specification.md` complete. After propagating every accepted compound
decision to its directly answered questionnaire rows, 187 rows remain `UNANSWERED`. Many can
be resolved by repository research or recommendation-led specification work; the remainder
must return to the owner in short, ordered batches rather than as a 187-question form.

Five factual items already have bounded research actions: `P-004`, `PL-003`, `PF-006`,
`PF-007`, and `PF-008`. The next discovery step is to classify the remaining keys into
research, specification recommendations, and genuine owner decisions, then prepare the next
manageable owner round. Architecture and implementation remain unauthorized until that
triage removes material product ambiguity and the owner explicitly authorizes the functional
specification.

## Explicitly outside this discovery session

- Implementing, prototyping, or changing the renderer;
- choosing React Native views, Reanimated, Gesture Handler, Skia, Canvas, a fork, or another rendering technology;
- accepting the proposed renderer API in the legacy prompt;
- accepting its performance numbers, page counts, overscan, event-volume targets, or device matrix;
- declaring any current React Native or Flutter behavior a parity requirement;
- removing `@howljs/calendar-kit`, its patch, or its adapter;
- writing a delivery estimate or implementation task breakdown;
- changing the current application behavior.

## How to run the next session

1. Read this README and `01-discovery-scope-and-evidence.md` completely.
2. Work through `02-functional-specification-questionnaire.md` with the product owner, starting with the blocking questions.
3. Record the owner's exact answer, decision status, and any examples. Do not silently normalize ambiguity.
4. If an answer depends on facts rather than preference, mark it `NEEDS_RESEARCH` and create a bounded research action. Do not guess.
5. Restate each completed topic as candidate requirements and non-requirements for owner confirmation.
6. Create the functional specification only after the owner confirms that the questionnaire is sufficiently resolved.
7. Keep architecture and implementation proposals out of the functional specification unless the product owner explicitly states a technical constraint as a requirement.
